import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { QdrantService } from '../services/ai/qdrant.js';

const qdrant = new QdrantService();

export default async function exportRoutes(fastify: FastifyInstance) {
  fastify.post('/api/export', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { format = 'json' } = request.body as any;

    const { results } = await qdrant.getTimeline(userId, 500, 0);

    if (format === 'csv') {
      const headers = ['id', 'title', 'content', 'url', 'source', 'timestamp'];
      const rows = results.map((r) => [
        r.id,
        `"${r.title.replace(/"/g, '""')}"`,
        `"${r.content.replace(/"/g, '""')}"`,
        r.url,
        r.source,
        new Date(Number(r.timestamp) * 1000).toISOString(),
      ]);
      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      return { format: 'csv', data: csvContent };
    }

    return { format: 'json', data: results };
  });

  fastify.get('/api/export/status/:jobId', { preHandler: authMiddleware }, async () => {
    return { status: 'COMPLETED' };
  });
}
