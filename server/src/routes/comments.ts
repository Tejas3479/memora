import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { commentCreateSchema, commentUpdateSchema } from '@memora/shared';

export default async function commentsRoutes(fastify: FastifyInstance) {
  fastify.post('/api/comments', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const result = commentCreateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') });
    }
    const { memoryId, content, parentId } = result.data;

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
    const result = commentUpdateSchema.safeParse(request.body);
    if (!result.success) {
      throw new Error(result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    const { content } = result.data;

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
