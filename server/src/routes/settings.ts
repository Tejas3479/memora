import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';

const settingsUpdateSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.boolean().optional(),
  autoCapture: z.boolean().optional(),
  excludedDomains: z.array(z.string()).optional(),
  retentionDays: z.number().int().min(1).max(3650).optional(),
  language: z.string().max(10).optional(),
  searchPreferences: z.record(z.any()).optional(),
}).passthrough();

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
    const result = settingsUpdateSchema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    const currentSettings = (user.settings as Record<string, any>) || {};

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          ...currentSettings,
          ...result.data,
        },
      },
    });

    return updated.settings;
  });
}
