import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

export default async function commentsRoutes(fastify: FastifyInstance) {
  fastify.post('/api/comments', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { memoryId, content, parentId } = request.body as any;

    if (!memoryId || !content) {
      return reply.status(400).send({ error: 'Memory ID and content are required' });
    }

    const comment = await prisma.comment.create({
      data: {
        userId,
        memoryId,
        content,
        parentId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return comment;
  });

  fastify.get('/api/comments/:memoryId', { preHandler: authMiddleware }, async (request) => {
    const { memoryId } = request.params as any;
    const comments = await prisma.comment.findMany({
      where: { memoryId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    // Filter down to root level threads
    return comments.filter((c: any) => !c.parentId);
  });

  fastify.put('/api/comments/:id', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { id } = request.params as any;
    const { content } = request.body as any;

    const exists = await prisma.comment.findFirst({ where: { id, userId } });
    if (!exists) throw new Error('Comment not found or access denied');

    return prisma.comment.update({
      where: { id },
      data: { content },
    });
  });

  fastify.delete('/api/comments/:id', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { id } = request.params as any;

    const exists = await prisma.comment.findFirst({ where: { id, userId } });
    if (!exists) throw new Error('Comment not found or access denied');

    await prisma.comment.delete({ where: { id } });
    return { success: true };
  });
}
