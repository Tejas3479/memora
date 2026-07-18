import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

export default async function feedbackRoutes(fastify: FastifyInstance) {
  fastify.post('/api/feedback', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { memoryId, signal, rating, comment } = request.body as any;

    const actualSignal = signal || 'rating';

    if (!memoryId) {
      return reply.status(400).send({ error: 'Memory ID is required' });
    }

    const item = await prisma.feedback.create({
      data: {
        userId,
        memoryId,
        signal: actualSignal,
        rating: rating !== undefined && rating !== null ? parseInt(rating, 10) : null,
        comment,
      },
    });

    return item;
  });

  fastify.get('/api/feedback', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    return prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  });
}
