import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { planLimitMiddleware, incrementIngestCounter } from '../middleware/planLimit.js';
import { ValidationError } from '../lib/errors.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { TextChunker } from '../services/ai/chunker.js';
import { EmbeddingService } from '../services/ai/embedding.js';
import { QdrantService } from '../services/ai/qdrant.js';
import { broadcastToUser } from '../websocket.js';
import crypto from 'crypto';

const chunker = new TextChunker();
const embeddingService = new EmbeddingService();
const qdrantService = new QdrantService();

export default async function transcribeRoutes(fastify: FastifyInstance) {
  fastify.post('/api/transcribe', { preHandler: [authMiddleware, planLimitMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    
    // Parse multipart fields
    const parts = request.parts();
    let audioBuffer: Buffer | null = null;
    let mimeType = 'audio/wav';
    let filename = 'audio.wav';
    let notes = '';

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'audio') {
        audioBuffer = await part.toBuffer();
        mimeType = part.mimetype;
        filename = part.filename;
      } else if (part.type === 'field' && part.fieldname === 'notes') {
        notes = part.value as string;
      }
    }

    if (!audioBuffer) {
      throw new ValidationError('Missing audio file');
    }

    if (audioBuffer.length > 15 * 1024 * 1024) {
      throw new ValidationError('Audio file size exceeds 15MB limit');
    }

    let transcript = '';
    let content = '';

    // If Gemini API Key is missing, fallback to mock transcription
    if (!config.llm.googleApiKey) {
      transcript = "This is a mock audio transcription. Please configure your Google Gemini API Key.";
      content = notes ? `${notes}\n\n[Transcript Context]\n${transcript}` : transcript;
    } else {
      try {
        const ai = new GoogleGenerativeAI(config.llm.googleApiKey);
        const model = ai.getGenerativeModel({ model: config.llm.model });

        // Step 1: Transcribe the audio file using Gemini's native audio understanding
        const transcriptionResult = await model.generateContent([
          {
            inlineData: {
              data: audioBuffer.toString('base64'),
              mimeType: mimeType,
            },
          },
          "Transcribe the audio exactly. Do not describe it, just output the words spoken."
        ]);

        transcript = transcriptionResult.response.text() || '';

        // Step 2: If notes are provided, expand notes using transcription context
        if (notes.trim()) {
          const enrichmentResult = await model.generateContent([
            `Voice Memo Transcript: "${transcript}"\n\nRough Note Context: "${notes}"\n\nTask: Merge the rough note context with the transcript details. Create a clean, well-structured, expanded note in markdown format that captures all information.`
          ]);
          content = enrichmentResult.response.text() || transcript;
        } else {
          content = transcript;
        }
      } catch (err) {
        console.error('[TranscribeRoute] Gemini processing failed, falling back to mock:', err);
        transcript = `[Error during transcription: ${(err as Error).message}]`;
        content = notes ? `${notes}\n\n${transcript}` : transcript;
      }
    }

    // Ingest transcribed memory
    const memoryId = crypto.randomUUID();
    const chunks = chunker.chunk(content, {
      title: `Audio Note: ${filename}`,
      url: `audio://${memoryId}`,
      source: 'AUDIO',
      timestamp: Math.floor(Date.now() / 1000),
      userId,
    });

    const textPieces = chunks.map((c) => c.text);
    const vectors = await embeddingService.embed(textPieces);

    const qPoints = chunks.map((chunk, i) => ({
      id: chunk.id,
      vector: vectors[i],
      payload: {
        userId,
        chunkId: chunk.id,
        source: 'AUDIO',
        url: `audio://${memoryId}`,
        title: `Audio Note: ${filename}`,
        content: chunk.text,
        timestamp: Math.floor(Date.now() / 1000),
        metadata: {
          memoryId,
          notes,
          transcript,
        },
      },
    }));

    await qdrantService.ensureCollection();
    await qdrantService.upsertMemories(qPoints);
    await incrementIngestCounter(userId);

    // Notify WS
    await broadcastToUser(userId, {
      type: 'ingest_status',
      data: { memoryId, title: filename, source: 'AUDIO', status: 'indexed' },
    });

    return {
      success: true,
      memoryId,
      transcript,
      content,
      chunksCreated: qPoints.length,
      status: 'indexed',
    };
  });
}
