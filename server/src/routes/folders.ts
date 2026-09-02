import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { FolderService } from '../services/domain/folder.js';
import { ValidationError } from '../lib/errors.js';
import { folderCreateSchema, folderUpdateSchema, folderAddMemoriesSchema } from '@memora/shared';

export default async function foldersRoutes(fastify: FastifyInstance) {
  fastify.get('/api/folders', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const folders = new FolderService(prisma);
    return folders.getTree(userId);
  });

  fastify.post('/api/folders', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const result = folderCreateSchema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    const { name, description, parentId, color, icon } = result.data;

    const folders = new FolderService(prisma);
    return folders.create(userId, { name, description, parentId, color, icon });
  });

  fastify.put('/api/folders/:id', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { id } = request.params as any;
    const result = folderUpdateSchema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }

    const folders = new FolderService(prisma);
    return folders.update(id, userId, result.data as any);
  });

  fastify.delete('/api/folders/:id', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { id } = request.params as any;

    const folders = new FolderService(prisma);
    await folders.delete(id, userId);
    return { success: true };
  });

  fastify.post('/api/folders/:id/memories', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { id } = request.params as any;
    const result = folderAddMemoriesSchema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }

    const folders = new FolderService(prisma);
    const updatedCount = await folders.addMemories(id, userId, result.data.memoryIds);
    return { success: true, count: updatedCount };
  });

  fastify.get('/api/folders/:id/memories', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { id } = request.params as any;

    const folders = new FolderService(prisma);
    return folders.getFolderMemories(id, userId);
  });
}
