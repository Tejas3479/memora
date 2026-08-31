import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { loopRunnerQueue } from '../jobs/index.js';
import { loopTriggerSchema, LoopType } from '@memora/shared';
import { ValidationError, NotFoundError } from '../lib/errors.js';
import { SelfReflectionLoop } from '../loops/selfReflection.js';
import { ConsolidationLoop } from '../loops/consolidation.js';
import { EvaluationLoop } from '../loops/evaluation.js';
import { MultiAgentLoop } from '../loops/multiAgent.js';
import { DreamingLoop } from '../loops/dreaming.js';
import { QdrantService } from '../services/ai/qdrant.js';

const qdrantService = new QdrantService();

export async function executeLoopDirectly(userId: string, loopType: LoopType, config: Record<string, any> = {}): Promise<any> {
  switch (loopType) {
    case 'SELF_REFLECTION': {
      const loop = new SelfReflectionLoop();
      return await loop.execute({
        userId,
        recentMemoryIds: config.recentMemoryIds || [],
        timeWindow: {
          start: config.dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: config.dateTo || new Date().toISOString(),
        },
      });
    }
    case 'CONSOLIDATION': {
      const loop = new ConsolidationLoop(qdrantService);
      return await loop.execute({
        userId,
        scope: config.scope || 'daily',
        cutoffDate: config.cutoffDate || new Date().toISOString(),
      });
    }
    case 'EVALUATION': {
      const loop = new EvaluationLoop();
      return await loop.execute({
        userId,
        period: {
          start: config.dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: config.dateTo || new Date().toISOString(),
        },
      });
    }
    case 'MULTI_AGENT': {
      const loop = new MultiAgentLoop();
      return await loop.execute({
        userId,
        task: config.task || 'Analyze recent memory themes',
        agents: config.agents || ['researcher', 'critic', 'synthesizer'],
        maxRounds: config.maxRounds || 3,
      });
    }
    case 'DREAMING': {
      const loop = new DreamingLoop(qdrantService);
      return await loop.execute({
        userId,
        mode: config.mode || 'connection-discovery',
      });
    }
    default:
      throw new Error(`Unsupported loop type: ${loopType}`);
  }
}

export default async function loopsRoutes(fastify: FastifyInstance) {
  // POST /api/loops/trigger - Trigger cognitive loop execution
  fastify.post('/api/loops/trigger', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = loopTriggerSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }

    const { loopType, config: loopConfig, sync } = parsed.data;
    const userId = request.user!.userId;

    const execution = await prisma.loopExecution.create({
      data: {
        userId,
        loopType,
        status: sync ? 'RUNNING' : 'PENDING',
        input: loopConfig,
      },
    });

    if (sync) {
      try {
        const output = await executeLoopDirectly(userId, loopType as LoopType, loopConfig);
        const completed = await prisma.loopExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            output: output as any,
            completedAt: new Date(),
          },
        });
        return reply.status(200).send({
          executionId: completed.id,
          loopType: completed.loopType,
          status: completed.status,
          output: completed.output,
        });
      } catch (err) {
        const errorMsg = (err as Error).message;
        await prisma.loopExecution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            error: errorMsg,
            completedAt: new Date(),
          },
        });
        return reply.status(500).send({
          executionId: execution.id,
          loopType,
          status: 'FAILED',
          error: errorMsg,
        });
      }
    }

    try {
      await loopRunnerQueue.add(
        'run-loop',
        {
          userId,
          loopType,
          executionId: execution.id,
          config: loopConfig,
        },
        {
          jobId: `loop-${execution.id}`,
        }
      );
    } catch (err) {
      // Fallback: If Redis is unavailable, execute asynchronously in-process
      executeLoopDirectly(userId, loopType as LoopType, loopConfig)
        .then(async (output) => {
          await prisma.loopExecution.update({
            where: { id: execution.id },
            data: {
              status: 'COMPLETED',
              output: output as any,
              completedAt: new Date(),
            },
          });
        })
        .catch(async (error) => {
          await prisma.loopExecution.update({
            where: { id: execution.id },
            data: {
              status: 'FAILED',
              error: error.message,
              completedAt: new Date(),
            },
          });
        });
    }

    return reply.status(202).send({
      executionId: execution.id,
      loopType: execution.loopType,
      status: 'PENDING',
    });
  });

  // GET /api/loops/history - Fetch past loop executions for user
  fastify.get('/api/loops/history', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const history = await prisma.loopExecution.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    return { executions: history };
  });

  // GET /api/loops/status/:id - Get execution status and results by ID
  fastify.get<{ Params: { id: string } }>('/api/loops/status/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params;

    const execution = await prisma.loopExecution.findUnique({
      where: { id },
    });

    if (!execution || execution.userId !== userId) {
      throw new NotFoundError('Loop execution not found');
    }

    return { execution };
  });
}
