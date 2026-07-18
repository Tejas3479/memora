import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { planLimitMiddleware, incrementIngestCounter } from '../middleware/planLimit.js';
import { ValidationError, NotFoundError, ForbiddenError, InternalError } from '../lib/errors.js';
import { TextChunker } from '../services/ai/chunker.js';
import { EmbeddingService } from '../services/ai/embedding.js';
import { QdrantService, QdrantPoint } from '../services/ai/qdrant.js';
import { AutomationService } from '../services/domain/automation.js';
import { broadcastToUser } from '../websocket.js';
import crypto from 'crypto';
import { ingestBodySchema } from '@memora/shared';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';
// @ts-ignore
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const chunker = new TextChunker();
const embeddingService = new EmbeddingService();
const qdrantService = new QdrantService();

export default async function ingestRoutes(fastify: FastifyInstance) {
  fastify.post('/api/ingest', { preHandler: [authMiddleware, planLimitMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const result = ingestBodySchema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    const { content, url, source, title, timestamp, metadata = {} } = result.data;

    const docTimestamp = Math.floor(new Date(timestamp).getTime() / 1000);
    const memoryId = crypto.randomUUID();

    // 1. Chunk content
    const chunks = chunker.chunk(content, {
      title,
      url,
      source,
      timestamp: docTimestamp,
      userId,
    });

    // 2. Embed chunks
    const textPieces = chunks.map((c) => c.text);
    const vectors = await embeddingService.embed(textPieces);

    // 3. Upsert to Qdrant
    const qPoints: QdrantPoint[] = chunks.map((chunk, i) => ({
      id: chunk.id,
      vector: vectors[i],
      payload: {
        userId,
        chunkId: chunk.id,
        source,
        url,
        title,
        content: chunk.text,
        timestamp: docTimestamp,
        metadata: { ...metadata, memoryId },
      },
    }));

    await qdrantService.upsertMemories(qPoints);

    // 4. Increment Redis limit counter
    await incrementIngestCounter(userId);

    // 5. Evaluate and trigger automation rules
    const prismaInstance = (fastify as any).prisma || (await import('../prisma.js')).prisma;
    const automation = new AutomationService(prismaInstance);
    await automation.evaluateRules(userId, memoryId, 'ON_INGEST', {
      title,
      content,
      source,
      metadata,
    });

    // 6. Emit real-time ingest update
    await broadcastToUser(userId, {
      type: 'ingest_status',
      data: { memoryId, title, source, status: 'indexed' },
    });

    return {
      success: true,
      memoryId,
      chunksCreated: chunks.length,
      status: 'indexed',
    };
  });

  fastify.get('/uploads/:filename', async (request, reply) => {
    const { filename } = request.params as any;
    const filePath = path.resolve(UPLOADS_DIR, filename);
    if (!filePath.startsWith(UPLOADS_DIR)) {
      throw new ForbiddenError('Directory traversal is not allowed');
    }
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError('File not found');
    }
    const stream = fs.createReadStream(filePath);
    return reply.send(stream);
  });

  fastify.post('/api/upload', { preHandler: [authMiddleware, planLimitMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const data = await request.file();
    if (!data) {
      throw new ValidationError('No file uploaded');
    }

    const buffer = await data.toBuffer();
    const memoryId = crypto.randomUUID();
    const fileName = `${memoryId}-${data.filename}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    // Save locally
    await fs.promises.writeFile(filePath, buffer);
    const fileUrl = `http://localhost:4000/uploads/${fileName}`;

    let text = '';
    let source = 'document';
    let isImage = false;

    try {
      if (data.mimetype === 'application/pdf') {
        const parsed = await pdf(buffer);
        text = parsed.text || '';
        source = 'document';
      } else if (data.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const parsed = await mammoth.extractRawText({ buffer });
        text = parsed.value || '';
        source = 'document';
      } else if (data.mimetype.startsWith('image/')) {
        isImage = true;
        source = 'image';
        
        // Run OCR fallback
        try {
          const worker = await createWorker('eng');
          const ocrRet = await worker.recognize(buffer);
          text = ocrRet.data.text || '';
          await worker.terminate();
        } catch (ocrErr) {
          console.warn('[UploadRoute] OCR processing failed:', ocrErr);
          text = `OCR failed for image: ${data.filename}`;
        }
      } else {
        throw new ValidationError(`Unsupported file type: ${data.mimetype}`);
      }
    } catch (err) {
      console.error('[UploadRoute] Error parsing file content:', err);
      throw new InternalError(`Failed to parse file: ${(err as Error).message}`);
    }

    let qPoints: QdrantPoint[] = [];

    if (isImage) {
      // Multimodal image embedding pathway
      const base64Image = buffer.toString('base64');
      const imageVector = await embeddingService.embedImage(base64Image);

      qPoints = [{
        id: crypto.randomUUID(),
        vector: imageVector,
        payload: {
          userId,
          chunkId: crypto.randomUUID(),
          source: 'image',
          url: fileUrl,
          title: data.filename,
          content: text || `Uploaded image: ${data.filename}`,
          timestamp: Math.floor(Date.now() / 1000),
          metadata: {
            modality: 'image',
            fileUrl,
            memoryId,
            ocrText: text,
          },
        },
      }];
    } else {
      // Document text chunking & embedding pathway
      const chunks = chunker.chunk(text || 'Empty document.', {
        title: data.filename,
        url: fileUrl,
        source,
        timestamp: Math.floor(Date.now() / 1000),
        userId,
      });

      const textPieces = chunks.map((c) => c.text);
      const vectors = await embeddingService.embed(textPieces);

      qPoints = chunks.map((chunk, i) => ({
        id: chunk.id,
        vector: vectors[i],
        payload: {
          userId,
          chunkId: chunk.id,
          source,
          url: fileUrl,
          title: data.filename,
          content: chunk.text,
          timestamp: Math.floor(Date.now() / 1000),
          metadata: {
            fileUrl,
            memoryId,
          },
        },
      }));
    }

    await qdrantService.ensureCollection();
    await qdrantService.upsertMemories(qPoints);
    await incrementIngestCounter(userId);

    // Evaluate rules
    const prismaInstance = (fastify as any).prisma || (await import('../prisma.js')).prisma;
    const automation = new AutomationService(prismaInstance);
    await automation.evaluateRules(userId, memoryId, 'ON_INGEST', {
      title: data.filename,
      content: text || `Uploaded file: ${data.filename}`,
      source,
      metadata: { fileUrl },
    });

    // Notify WS
    await broadcastToUser(userId, {
      type: 'ingest_status',
      data: { memoryId, title: data.filename, source, status: 'indexed' },
    });

    return {
      success: true,
      memoryId,
      chunksCreated: qPoints.length,
      status: 'indexed',
      fileUrl,
    };
  });
}
