import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { QdrantService } from '../services/ai/qdrant.js';

const qdrant = new QdrantService();

export default async function timelineRoutes(fastify: FastifyInstance) {
  fastify.get('/api/timeline', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { limit = '20', offset = '0', source, dateFrom, dateTo } = request.query as any;

    const limitVal = parseInt(limit, 10);
    const offsetVal = parseInt(offset, 10);

    const { results, total } = await qdrant.getTimeline(
      userId,
      limitVal,
      offsetVal,
      source,
      dateFrom,
      dateTo
    );

    return {
      items: results,
      total,
      hasMore: results.length === limitVal,
    };
  });
}
