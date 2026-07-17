import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { encrypt } from '../lib/crypto.js';
import { config } from '../config.js';

export default async function integrationsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/integrations', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const items = await prisma.integration.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        scope: true,
        createdAt: true,
      },
    });
    return items;
  });

  fastify.delete('/api/integrations/:id', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { id } = request.params as any;

    await prisma.integration.deleteMany({
      where: { id, userId },
    });

    return { success: true };
  });

  // OAuth entry points placeholders
  fastify.get('/auth/slack', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=slack_success`);
  });

  fastify.get('/auth/slack/callback', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=slack_success`);
  });

  fastify.get('/auth/notion', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=notion_success`);
  });

  fastify.get('/auth/notion/callback', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=notion_success`);
  });

  fastify.get('/auth/google', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=google_success`);
  });

  fastify.get('/auth/google/callback', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=google_success`);
  });

  fastify.get('/auth/github', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=github_success`);
  });

  fastify.get('/auth/github/callback', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=github_success`);
  });
}
