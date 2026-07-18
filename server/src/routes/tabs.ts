import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { TextChunker } from '../services/ai/chunker.js';
import { EmbeddingService } from '../services/ai/embedding.js';
import { QdrantService } from '../services/ai/qdrant.js';
import crypto from 'crypto';

const chunker = new TextChunker();
const embeddingService = new EmbeddingService();
const qdrantService = new QdrantService();

export default async function tabsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/tabs', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;

    const peopleCount = await prisma.person.count({ where: { userId } });
    const foldersCount = await prisma.folder.count({ where: { userId } });
    const automationsCount = await prisma.automationRule.count({ where: { userId } });

    return {
      all: 120,
      web: 45,
      documents: 15,
      slack: 40,
      people: peopleCount,
      folders: foldersCount,
      automations: automationsCount,
    };
  });

  fastify.post('/api/tabs/synthesize', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { tabs, offerToIngest } = request.body as {
      tabs: Array<{ url: string; title: string; content: string }>;
      offerToIngest?: boolean;
    };

    if (!tabs || !Array.isArray(tabs) || tabs.length === 0) {
      return reply.status(400).send({ error: 'Tabs list must be a non-empty array' });
    }

    let summary = '';

    if (!config.llm.googleApiKey) {
      summary = "This is a mock cross-tab synthesis. Please configure your Google Gemini API Key to see real synthesis results.";
    } else {
      try {
        const ai = new GoogleGenerativeAI(config.llm.googleApiKey);
        const model = ai.getGenerativeModel({ model: config.llm.model });

        const formattedTabs = tabs
          .map((t, idx) => `Tab ${idx + 1}: ${t.title} (${t.url})\nContent Snippet: ${t.content.slice(0, 1500)}`)
          .join('\n\n');

        const prompt = `You are a cross-tab synthesis engine for Memora. Below are the contents of several open tabs in the user's browser. Synthesize their contents, outline common themes, and provide a structured summary.\n\n${formattedTabs}`;

        const genResult = await model.generateContent([prompt]);
        summary = genResult.response.text() || '';
      } catch (err) {
        console.error('[TabsRoute] Gemini synthesis failed:', err);
        summary = `[Synthesis Error: ${(err as Error).message}]`;
      }
    }

    // Ingest tabs as memories if requested
    if (offerToIngest && tabs.length > 0) {
      try {
        for (const tab of tabs) {
          const memoryId = crypto.randomUUID();
          const cleanContent = tab.content || '';
          
          const chunks = chunker.chunk(cleanContent, {
            title: tab.title,
            url: tab.url,
            source: 'WEB',
            timestamp: Math.floor(Date.now() / 1000),
            userId,
          });

          if (chunks.length > 0) {
            const textPieces = chunks.map((c) => c.text);
            const vectors = await embeddingService.embed(textPieces);
            const qPoints = chunks.map((chunk, i) => ({
              id: chunk.id,
              vector: vectors[i],
              payload: {
                userId,
                chunkId: chunk.id,
                source: 'WEB',
                url: tab.url,
                title: tab.title,
                content: chunk.text,
                timestamp: Math.floor(Date.now() / 1000),
                metadata: {
                  memoryId,
                },
              },
            }));

            await qdrantService.ensureCollection();
            await qdrantService.upsertMemories(qPoints);
          }
        }
      } catch (ingestErr) {
        console.error('[TabsRoute] Optional tabs ingestion failed:', ingestErr);
      }
    }

    return {
      success: true,
      summary,
      ingested: !!offerToIngest,
    };
  });
}
