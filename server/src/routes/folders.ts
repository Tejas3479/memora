import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { FolderService } from '../services/domain/folder.js';

export default async function foldersRoutes(fastify: FastifyInstance) {
  fastify.get('/api/folders', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const folders = new FolderService(prisma);
    return folders.getTree(userId);
  });

  fastify.post('/api/folders', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { name, description, parentId, color, icon } = request.body as any;

    const folders = new FolderService(prisma);
    return folders.create(userId, { name, description, parentId, color, icon });
  });

  fastify.put('/api/folders/:id', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { id } = request.params as any;
    const body = request.body as any;

    const folders = new FolderService(prisma);
    return folders.update(id, userId, body);
  });

  fastify.delete('/api/folders/:id', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { id } = request.params as any;

    const folders = new FolderService(prisma);
    await folders.delete(id, userId);
    return { success: true };
  });

  fastify.post('/api/folders/:id/memories', { preHandler: authMiddleware }, async (request) => {
    // In production, updates Qdrant vector payload.
    return { success: true };
  });
}
