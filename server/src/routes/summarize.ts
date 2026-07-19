import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { planLimitMiddleware } from '../middleware/planLimit.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { summarizeRequestSchema, MemorySource } from '@memora/shared';
import { TextChunker } from '../services/ai/chunker.js';
import { EmbeddingService } from '../services/ai/embedding.js';
import { QdrantService, QdrantPoint } from '../services/ai/qdrant.js';
import { retry } from '../lib/utils.js';
import { geminiBreaker } from '../lib/circuitBreaker.js';
import crypto from 'crypto';

const chunker = new TextChunker();
const embeddingService = new EmbeddingService();
const qdrantService = new QdrantService();

const ai = config.llm.googleApiKey ? new GoogleGenerativeAI(config.llm.googleApiKey) : null;

export default async function summarizeRoutes(fastify: FastifyInstance) {
  fastify.post('/api/summarize', { preHandler: [authMiddleware, planLimitMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const parseResult = summarizeRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
    }

    const { url, title, content } = parseResult.data;
    const timestamp = Math.floor(Date.now() / 1000);
    const memoryId = crypto.randomUUID();

    let summaryData = {
      tldr: `Summary of page: ${title}`,
      keyPoints: ['No GOOGLE_API_KEY was provided to generate full AI summaries.', 'Save highlights to build your memory layer manually.'],
      tags: ['web', 'offline-capture'],
    };

    if (ai) {
      try {
        const model = ai.getGenerativeModel({ model: config.llm.model });
        const prompt = `You are Memora's webpage summarizer engine. Analyze the following webpage text content and generate a structured JSON summary.
Webpage Title: "${title}"
Webpage URL: "${url}"

Webpage Content:
"""
${content.slice(0, 15000)}
"""

Format the output strictly as a JSON object matching this structure:
{
  "tldr": "A 1-2 sentence TL;DR of the webpage.",
  "keyPoints": [
    "Key takeaway point 1",
    "Key takeaway point 2",
    "Key takeaway point 3"
  ],
  "tags": ["tag1", "tag2", "tag3"]
}`;

        const result = await geminiBreaker.execute(() =>
          retry(
            () => model.generateContent(prompt),
            { attempts: 3, delay: 1000, backoff: 'exponential' }
          )
        );
        const text = result.response.text();
        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}') + 1;
        
        if (startIdx >= 0 && endIdx > startIdx) {
          summaryData = JSON.parse(text.slice(startIdx, endIdx));
        }
      } catch (err) {
        console.error('[SummarizeRoute] Gemini summary failed, falling back:', err);
      }
    }

    // Index the summary in Qdrant so it is searchable
    const summaryText = `${summaryData.tldr}\n\nKey Takeaways:\n${summaryData.keyPoints.map((p) => `- ${p}`).join('\n')}`;
    const chunks = chunker.chunk(summaryText, {
      title: `Summary: ${title}`,
      url,
      source: MemorySource.WEB,
      timestamp,
      userId,
    });

    const textPieces = chunks.map((c) => c.text);
    const vectors = await embeddingService.embed(textPieces);

    const qPoints: QdrantPoint[] = chunks.map((chunk, i) => ({
      id: chunk.id,
      vector: vectors[i],
      payload: {
        userId,
        chunkId: chunk.id,
        source: MemorySource.WEB,
        url,
        title: `Summary: ${title}`,
        content: chunk.text,
        timestamp,
        metadata: {
          isSummary: true,
          originalTitle: title,
          summaryJson: summaryData,
          tags: summaryData.tags,
          memoryId,
        },
      },
    }));

    await qdrantService.ensureCollection();
    await qdrantService.upsertMemories(qPoints);

    return {
      success: true,
      summary: summaryData,
      memoryId,
    };
  });
}
