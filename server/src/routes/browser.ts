import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { BROWSER_ACTIONS_ALLOWLIST } from '@memora/shared';
import { prisma } from '../prisma.js';

export default async function browserRoutes(fastify: FastifyInstance) {
  fastify.post('/api/browser/action', { preHandler: authMiddleware }, async (request, reply) => {
    const { action, data } = request.body as any;

    if (!BROWSER_ACTIONS_ALLOWLIST.includes(action)) {
      return reply.status(403).send({ error: 'Browser action not permitted in allowlist' });
    }

    // Process allowable action
    return { success: true, action, processedAt: new Date() };
  });

  fastify.get('/api/browser/config', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const settings = (user?.settings as Record<string, any>) || {};
    
    return {
      autoCaptureEnabled: settings.autoCaptureEnabled ?? true,
      blockedSites: settings.blockedSites ?? [],
    };
  });

  fastify.put('/api/browser/config', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const body = request.body as any;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const settings = (user?.settings as Record<string, any>) || {};

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          ...settings,
          autoCaptureEnabled: body.autoCaptureEnabled ?? settings.autoCaptureEnabled,
          blockedSites: body.blockedSites ?? settings.blockedSites,
        },
      },
    });

    return updated.settings;
  });
}
