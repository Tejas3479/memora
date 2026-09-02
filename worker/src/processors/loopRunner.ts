import { Job } from 'bullmq';
import { LoopType } from '@memora/shared';

import { SelfReflectionLoop } from '../loops/selfReflection.js';
import { ConsolidationLoop } from '../loops/consolidation.js';
import { EvaluationLoop } from '../loops/evaluation.js';
import { MultiAgentLoop } from '../loops/multiAgent.js';
import { DreamingLoop } from '../loops/dreaming.js';
import { QdrantService } from '../services/qdrant.js';
import { prisma } from '../prisma.js';

const qdrant = new QdrantService();

export async function loopRunnerProcessor(
  job: Job<{ userId: string; loopType: LoopType; executionId?: string; config?: Record<string, any> }>
): Promise<any> {
  const { userId, loopType, executionId: existingExecutionId, config = {} } = job.data;

  let executionId = existingExecutionId;
  if (executionId) {
    await prisma.loopExecution.update({
      where: { id: executionId },
      data: { status: 'RUNNING' },
    });
  } else {
    const execution = await prisma.loopExecution.create({
      data: {
        userId,
        loopType,
        status: 'RUNNING',
        input: { config },
      },
    });
    executionId = execution.id;
  }

  try {
    let output: any;

    switch (loopType) {
      case 'SELF_REFLECTION': {
        const loop = new SelfReflectionLoop();
        output = await loop.execute({
          userId,
          recentMemoryIds: config.recentMemoryIds || [],
          timeWindow: {
            start: config.dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: config.dateTo || new Date().toISOString(),
          },
        });
        break;
      }
      case 'CONSOLIDATION': {
        const loop = new ConsolidationLoop(qdrant);
        output = await loop.execute({
          userId,
          scope: config.scope || 'daily',
          cutoffDate: config.cutoffDate || new Date().toISOString(),
        });
        break;
      }
      case 'EVALUATION': {
        const loop = new EvaluationLoop();
        output = await loop.execute({
          userId,
          period: {
            start: config.dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: config.dateTo || new Date().toISOString(),
          },
        });
        break;
      }
      case 'MULTI_AGENT': {
        const loop = new MultiAgentLoop();
        output = await loop.execute({
          userId,
          task: config.task || 'Summarize key developer interactions',
          agents: config.agents || ['researcher', 'critic', 'synthesizer'],
          maxRounds: config.maxRounds || 3,
        });
        break;
      }
      case 'DREAMING': {
        const loop = new DreamingLoop(qdrant);
        output = await loop.execute({
          userId,
          mode: config.mode || 'connection-discovery',
        });
        break;
      }
      default:
        throw new Error(`Unsupported loop type: ${loopType}`);
    }

    await prisma.loopExecution.update({
      where: { id: executionId },
      data: {
        status: 'COMPLETED',
        output: output as any,
        completedAt: new Date(),
      },
    });

    return output;
  } catch (err) {
    const errorMsg = (err as Error).message;
    await prisma.loopExecution.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        error: errorMsg,
        completedAt: new Date(),
      },
    });
    throw err;
  }
}
