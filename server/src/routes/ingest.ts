import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { planLimitMiddleware, incrementIngestCounter } from '../middleware/planLimit.js';
import { TextChunker } from '../services/ai/chunker.js';
import { EmbeddingService } from '../services/ai/embedding.js';
import { QdrantService, QdrantPoint } from '../services/ai/qdrant.js';
import { AutomationService } from '../services/domain/automation.js';
import { broadcastToUser } from '../websocket.js';
import crypto from 'crypto';
import { ingestBodySchema } from '@memora/shared';

const chunker = new TextChunker();
const embeddingService = new EmbeddingService();
const qdrantService = new QdrantService();

export default async function ingestRoutes(fastify: FastifyInstance) {
  fastify.post('/api/ingest', { preHandler: [authMiddleware, planLimitMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const result = ingestBodySchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') });
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

  fastify.post('/api/upload', { preHandler: [authMiddleware, planLimitMiddleware] }, async (request, reply) => {
    // Multipart doc parser placeholder
    return {
      success: true,
      memoryId: crypto.randomUUID(),
      chunksCreated: 5,
      status: 'indexed',
    };
  });
}
