import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { EmbeddingService } from '../services/ai/embedding.js';
import { QdrantService } from '../services/ai/qdrant.js';
import { SynthesisService } from '../services/ai/synthesis.js';
import { AgenticSearchGraph } from '../agents/agenticSearchGraph.js';
import { searchBodySchema } from '@memora/shared';

const embedding = new EmbeddingService();
const qdrant = new QdrantService();
const synthesis = new SynthesisService();

export default async function searchRoutes(fastify: FastifyInstance) {
  fastify.post('/api/search', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const result = searchBodySchema.safeParse(request.body);
    if (!result.success) {
      throw new Error(result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    const { query, filters, limit, offset } = result.data;

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

    const answer = await synthesis.synthesize(query, results);

    return {
      results,
      synthesizedAnswer: answer,
      total: results.length,
      took: 10, // Milliseconds estimate
    };
  });
}
