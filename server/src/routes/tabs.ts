import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

export default async function tabsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/tabs', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;

    // Fetch counts from database or vector payloads.
    // For MVP, we return active tabs with placeholder/mock values
    const peopleCount = await prisma.person.count({ where: { userId } });
    const foldersCount = await prisma.folder.count({ where: { userId } });
    const automationsCount = await prisma.automationRule.count({ where: { userId } });

    return {
      all: 120,
      web: 45,
      documents: 15,
      slack: 40,
      people: peopleCount,
      folders: foldersCount,
      automations: automationsCount,
    };
  });
}
