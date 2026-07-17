import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

export default async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/settings', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });
    return user?.settings || {};
  });

  fastify.put('/api/settings', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const body = request.body as any;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const currentSettings = (user?.settings as Record<string, any>) || {};

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          ...currentSettings,
          ...body,
        },
      },
    });

    return updated.settings;
  });
}
