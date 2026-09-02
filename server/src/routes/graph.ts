import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { GraphBuilderService } from '../services/domain/graph.js';
import { ZepService } from '../services/domain/zep.js';

const zep = new ZepService();
const graphBuilder = new GraphBuilderService(prisma);

export default async function graphRoutes(fastify: FastifyInstance) {
  fastify.get('/api/graph', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { query = '' } = request.query as any;

    const data = await graphBuilder.buildGraph(userId, query);

    // If external Zep facts are available, merge them in as CONCEPT nodes
    try {
      if (query && query.trim()) {
        const zepNodes = await zep.queryGraph(userId, query);
        for (const zn of zepNodes) {
          data.graph.nodes.push({
            id: zn.id || crypto.randomUUID(),
            type: 'CONCEPT',
            label: zn.fact || zn.label || 'Extracted Concept',
            properties: zn,
          });
        }
        data.stats.nodeCount = data.graph.nodes.length;
      }
    } catch (zepErr) {
      // Non-blocking fallback
    }

    return data;
  });

  fastify.get('/api/graph/nodes/:id', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { id } = request.params as any;
    return graphBuilder.getNodeDetails(userId, id);
  });

  fastify.post('/api/graph/explore', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { query = '' } = request.body as any;
    return graphBuilder.buildGraph(userId, query);
  });
}
