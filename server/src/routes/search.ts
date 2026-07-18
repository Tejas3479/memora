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

    // Use agentic search graph if it involves complex queries
    if (query.toLowerCase().includes('and') || query.toLowerCase().includes('or')) {
      const graph = new AgenticSearchGraph(qdrant, synthesis);
      return graph.run({ userId, query, filters });
    }

    // Standard hybrid search
    const queryVector = await embedding.embedSingle(query);
    const results = await qdrant.hybridSearch({
      userId,
      vector: queryVector,
      query,
      filters,
      limit,
    });

    if (stream) {
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      // Stream sources first
      reply.raw.write(`data: ${JSON.stringify({ type: 'sources', results })}\n\n`);

      try {
        const streamGenerator = synthesis.synthesizeStream(query, results);
        for await (const chunk of streamGenerator) {
          reply.raw.write(`data: ${JSON.stringify({ type: 'token', token: chunk })}\n\n`);
        }
      } catch (err) {
        console.error('[SearchRoute] Streaming error:', err);
      }

      reply.raw.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      reply.raw.end();
      return;
    }

    const answer = await synthesis.synthesize(query, results);

    return {
      results,
      synthesizedAnswer: answer,
      total: results.length,
      took: 10,
    };
  });
}
