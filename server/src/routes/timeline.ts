import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

export default async function timelineRoutes(fastify: FastifyInstance) {
  fastify.get('/api/timeline', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { limit = '20', offset = '0', source, folderId, dateFrom, dateTo } = request.query as any;

    const limitVal = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offsetVal = Math.max(0, parseInt(offset, 10) || 0);

    const where: any = { userId };
    if (source) {
      where.source = source.toUpperCase();
    }
    if (folderId) {
      where.folderId = folderId;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [memories, total] = await Promise.all([
      prisma.memory.findMany({
        where,
        skip: offsetVal,
        take: limitVal,
        orderBy: { createdAt: 'desc' },
        include: {
          folder: {
            select: { id: true, name: true, color: true, icon: true },
          },
          highlights: {
            select: { id: true, text: true, color: true },
          },
          comments: {
            select: { id: true },
          },
        },
      }),
      prisma.memory.count({ where }),
    ]);

    const items = memories.map((m) => ({
      id: m.id,
      title: m.title,
      content: m.content,
      source: m.source.toLowerCase(),
      url: m.url,
      timestamp: Math.floor(m.createdAt.getTime() / 1000),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      folderId: m.folderId,
      folder: m.folder,
      highlightsCount: m.highlights.length,
      commentsCount: m.comments.length,
      metadata: m.metadata,
    }));

    return {
      items,
      total,
      hasMore: offsetVal + items.length < total,
    };
  });
}
