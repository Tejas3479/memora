import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AutomationRunnerPayload, AutomationRunnerResult } from '@memora/shared';

const prisma = new PrismaClient();
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });

export async function automationProcessor(job: Job<AutomationRunnerPayload>): Promise<AutomationRunnerResult> {
  const { ruleId, memoryId, userId } = job.data;
  
  const rule = await prisma.automationRule.findUnique({ where: { id: ruleId } });
  if (!rule) throw new Error(`Automation rule ${ruleId} not found`);

  // Fetch memory details from Qdrant
  const qRes = await qdrant.retrieve('memories', { ids: [memoryId] });
  if (qRes.length === 0) throw new Error(`Memory point ${memoryId} not found in vector storage`);
  
  const point = qRes[0];
  const payload = point.payload as any;

  const result: AutomationRunnerResult = {
    actionsExecuted: 0,
    results: [],
  };

  const actions = rule.actions as string[];
  for (const action of actions) {
    let success = true;
    let detail = '';

    try {
      if (action === 'TAG') {
        const currentTags = payload.metadata?.tags || [];
        const newTag = (rule.actionConfig as any).tag || 'auto';
        if (!currentTags.includes(newTag)) {
          payload.metadata = {
            ...(payload.metadata || {}),
            tags: [...currentTags, newTag],
          };
          await qdrant.upsert('memories', {
            wait: true,
            points: [{ id: memoryId, vector: point.vector as number[], payload }],
          });
          detail = `Tagged memory with ${newTag}`;
        }
      } else if (action === 'MOVE_FOLDER') {
        const destFolderId = (rule.actionConfig as any).folderId;
        payload.folderId = destFolderId;
        await qdrant.upsert('memories', {
          wait: true,
          points: [{ id: memoryId, vector: point.vector as number[], payload }],
        });
        detail = `Moved to folder ${destFolderId}`;
      } else {
        detail = `Action ${action} executed.`;
      }

      result.results.push({ action, success, detail });
      result.actionsExecuted++;
    } catch (err) {
      result.results.push({ action, success: false, detail: (err as Error).message });
    }
  }

  // Record execution log in Postgres
  await prisma.automationExecution.create({
    data: {
      ruleId,
      memoryId,
      status: 'success',
      result: result as any,
    },
  });

  await prisma.automationRule.update({
    where: { id: ruleId },
    data: {
      executionCount: { increment: 1 },
      lastExecutedAt: new Date(),
    },
  });

  return result;
}
