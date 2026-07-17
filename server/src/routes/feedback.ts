import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

export default async function feedbackRoutes(fastify: FastifyInstance) {
  fastify.post('/api/feedback', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { memoryId, rating, comment } = request.body as any;

    if (!memoryId || rating === undefined) {
      return reply.status(400).send({ error: 'Memory ID and rating are required' });
    }

    const item = await prisma.feedback.create({
      data: {
        userId,
        memoryId,
        rating: parseInt(rating, 10),
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
