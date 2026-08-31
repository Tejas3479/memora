import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { ValidationError } from '../lib/errors.js';
import { EmbeddingService } from '../services/ai/embedding.js';
import { QdrantService } from '../services/ai/qdrant.js';
import { SynthesisService } from '../services/ai/synthesis.js';
import { AgenticSearchGraph } from '../agents/agenticSearchGraph.js';
import { searchBodySchema } from '@memora/shared';

const embedding = new EmbeddingService();
const qdrant = new QdrantService();
const synthesis = new SynthesisService();

export default async function searchRoutes(fastify: FastifyInstance) {
  fastify.post('/api/search', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const result = searchBodySchema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    const { query, filters, limit } = result.data;
    const stream = (request.body as any).stream === true;

    // Set up AbortController for client disconnect handling
    const abortController = new AbortController();
    request.raw.on('close', () => {
      abortController.abort();
    });
    request.raw.on('aborted', () => {
      abortController.abort();
    });

    const isComplex = query.toLowerCase().includes(' and ') || query.toLowerCase().includes(' or ') || query.includes(';') || query.length > 80;
    let results: any[] = [];
    let subQueries: string[] = [query];

    if (isComplex) {
      const graph = new AgenticSearchGraph(qdrant, synthesis);
      const retrieved = await graph.planAndRetrieve({ userId, query, filters });
      results = retrieved.results;
      subQueries = retrieved.subQueries;
    } else {
      const queryVector = await embedding.embedSingle(query);
      results = await qdrant.hybridSearch({
        userId,
        vector: queryVector,
        query,
        filters,
        limit,
      });
    }

    if (stream) {
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      // Stream sub-queries event if decomposed
      if (subQueries.length > 1) {
        reply.raw.write(`data: ${JSON.stringify({ type: 'sub_queries', subQueries })}\n\n`);
      }

      // Stream candidate sources
      reply.raw.write(`data: ${JSON.stringify({ type: 'sources', results })}\n\n`);

      try {
        const streamGenerator = synthesis.synthesizeStream(query, results, abortController.signal);
        for await (const chunk of streamGenerator) {
          if (abortController.signal.aborted) break;
          reply.raw.write(`data: ${JSON.stringify({ type: 'token', token: chunk })}\n\n`);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error('[SearchRoute] Streaming error:', err);
        }
      }

      if (!abortController.signal.aborted) {
        reply.raw.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        reply.raw.end();
      }
      return;
    }

    const answer = await synthesis.synthesize(query, results);

    return {
      results,
      synthesizedAnswer: answer,
      subQueries: subQueries.length > 1 ? subQueries : undefined,
      total: results.length,
      took: 10,
    };
  });
}
