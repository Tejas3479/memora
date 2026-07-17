import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { ProactiveService } from '../services/domain/proactive.js';
import { QdrantService } from '../services/ai/qdrant.js';

const qdrant = new QdrantService();
const proactive = new ProactiveService(qdrant);

export default async function proactiveRoutes(fastify: FastifyInstance) {
  fastify.post('/api/proactive', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { type, identifier, recentText } = request.body as any;

    const memories = await proactive.processContext(userId, { type, identifier, recentText });
    await proactive.publishToUser(userId, memories);

    return { success: true, count: memories.length };
  });

  fastify.get('/api/proactive/recent', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const history = await proactive.getRecentContexts(userId);
    return history;
  });
}
