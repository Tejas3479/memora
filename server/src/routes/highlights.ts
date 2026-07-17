import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { createHighlightSchema } from '@memora/shared';

export default async function highlightsRoutes(fastify: FastifyInstance) {
  fastify.post('/api/highlights', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const result = createHighlightSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
    }

    const { url, text, note, color, memoryId } = result.data;

    const highlight = await prisma.highlight.create({
      data: {
        userId,
        url,
        text,
        note,
        color,
        memoryId,
      },
    });

    return highlight;
  });

  fastify.get('/api/highlights', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { url } = request.query as any;

    if (!url) {
      throw new Error('Query parameter "url" is required');
    }

    const highlights = await prisma.highlight.findMany({
      where: {
        userId,
        url,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return highlights;
  });

  fastify.delete('/api/highlights/:id', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { id } = request.params as any;

    const highlight = await prisma.highlight.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!highlight) {
      throw new Error('Highlight not found');
    }

    await prisma.highlight.delete({
      where: {
        id,
      },
    });

    return { success: true };
  });
}
