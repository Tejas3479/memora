import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { planLimitMiddleware, incrementIngestCounter } from '../middleware/planLimit.js';
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

    const [allCount, webCount, docCount, slackCount, peopleCount, foldersCount, automationsCount] = await Promise.all([
      prisma.memory.count({ where: { userId } }),
      prisma.memory.count({ where: { userId, source: 'WEB' } }),
      prisma.memory.count({ where: { userId, source: { in: ['DOCUMENT', 'PDF', 'IMAGE'] } } }),
      prisma.memory.count({ where: { userId, source: 'SLACK' } }),
      prisma.person.count({ where: { userId } }),
      prisma.folder.count({ where: { userId } }),
      prisma.automationRule.count({ where: { userId } }),
    ]);

    return {
      all: allCount,
      web: webCount,
      documents: docCount,
      slack: slackCount,
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
      return reply.status(400).send({ error: 'No tabs provided' });
    }

    // Synthesize content from all tabs
    const prompt = `Synthesize and summarize the key insights, shared themes, and takeaways across the following browser tabs:
${tabs.map((t, i) => `\n[Tab ${i + 1}] Title: ${t.title}\nURL: ${t.url}\nContent snippet: ${t.content.slice(0, 1000)}...`).join('\n')}

Provide an organized summary in clean Markdown format.`;

    let summary = '';
    if (config.llm.googleApiKey) {
      try {
        const ai = new GoogleGenerativeAI(config.llm.googleApiKey);
        const model = ai.getGenerativeModel({ model: config.llm.model });
        const res = await model.generateContent(prompt);
        summary = res.response.text() || '';
      } catch (err) {
        console.error('[TabsRoute] Gemini tabs synthesis failed:', err);
        summary = 'Failed to synthesize tabs content due to model rate limits or availability.';
      }
    } else {
      summary = 'This is a mock cross-tab synthesis. Please configure your Google Gemini API Key to see real synthesis results.';
    }

    // Ingest tabs as memories if requested
    if (offerToIngest && tabs.length > 0) {
      try {
        for (const tab of tabs) {
          const cleanContent = tab.content || '';
          const memory = await prisma.memory.create({
            data: {
              userId,
              title: tab.title,
              content: cleanContent,
              source: 'WEB',
              url: tab.url,
              metadata: {},
            },
          });
          const memoryId = memory.id;

          const chunks = chunker.chunk(cleanContent, {
            title: tab.title,
            url: tab.url,
            source: 'WEB',
            timestamp: Math.floor(Date.now() / 1000),
            userId,
            memoryId,
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
                memoryId,
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
            await incrementIngestCounter(userId);
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
