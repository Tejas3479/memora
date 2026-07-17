import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { ZepService } from '../services/domain/zep.js';

const zep = new ZepService();

export default async function graphRoutes(fastify: FastifyInstance) {
  fastify.get('/api/graph', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { query = '' } = request.query as any;

    const nodes = await zep.queryGraph(userId, query);
    const edges: any[] = [];

    // Assemble dummy node connections for visualization fallback
    if (nodes.length > 0) {
      edges.push({
        id: 'edge-1',
        sourceId: nodes[0].id,
        targetId: 'concept-target',
        type: 'RELATES_TO',
      });
    }

    return {
      graph: {
        nodes: [
          ...nodes,
          {
            id: 'concept-target',
            type: 'CONCEPT',
            label: 'Vector Database Ingestions',
            properties: {},
            createdAt: new Date(),
          },
        ],
        edges,
      },
      stats: {
        nodeCount: nodes.length + 1,
        edgeCount: edges.length,
      },
    };
  }  );

  fastify.get('/api/graph/nodes/:id', { preHandler: authMiddleware }, async (request) => {
    const { id } = request.params as any;
    return {
      node: {
        id,
        type: 'CONCEPT',
        label: 'Node details',
        properties: {},
      },
      connections: [],
    };
  });

  fastify.post('/api/graph/explore', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { query } = request.body as any;
    const nodes = await zep.queryGraph(userId, query);
    return { nodes };
  });
}
