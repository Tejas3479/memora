import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { SidebarService } from '../services/domain/sidebar.js';
import { QdrantService } from '../services/ai/qdrant.js';

const qdrant = new QdrantService();
const sidebar = new SidebarService(qdrant);

export default async function sidebarRoutes(fastify: FastifyInstance) {
  fastify.post('/api/sidebar/context', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { url, title, content } = request.body as any;

    const memories = await sidebar.getContextualMemories(userId, url, content);
    const actions = await sidebar.getSuggestedActions(userId, memories);

    return {
      memories,
      actions,
    };
  });

  fastify.get('/api/sidebar/suggestions', { preHandler: authMiddleware }, async (request) => {
    return {
      suggestions: [
        { title: 'Read scaling Qdrant logs', score: 0.8 },
      ],
    };
  });
}
