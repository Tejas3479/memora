import { Job } from 'bullmq';
import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AutomationRunnerPayload, AutomationRunnerResult } from '@memora/shared';
import { prisma } from '../prisma.js';
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  checkCompatibility: false,
});

export async function automationProcessor(job: Job<AutomationRunnerPayload>): Promise<AutomationRunnerResult> {
  const { ruleId, memoryId, userId } = job.data;
  
  const rule = await prisma.automationRule.findUnique({ where: { id: ruleId } });
  if (!rule) throw new Error(`Automation rule ${ruleId} not found`);

  if (!rule.enabled) {
    return { actionsExecuted: 0, results: [] };
  }

  // Fetch memory details from PostgreSQL
  const memory = await prisma.memory.findFirst({ where: { id: memoryId, userId } });
  if (!memory) throw new Error(`Memory ${memoryId} not found`);

  const result: AutomationRunnerResult = {
    actionsExecuted: 0,
    results: [],
  };

  const actions = (rule.actions as string[]) || [];
  for (const action of actions) {
    let success = true;
    let detail = '';

    try {
      if (action === 'TAG') {
        const currentMeta = (memory.metadata as Record<string, any>) || {};
        const currentTags = Array.isArray(currentMeta.tags) ? currentMeta.tags : [];
        const newTag = (rule.actionConfig as any)?.tagName || (rule.actionConfig as any)?.tag || 'auto';
        if (!currentTags.includes(newTag)) {
          const updatedTags = [...currentTags, newTag];
          await prisma.memory.update({
            where: { id: memoryId },
            data: {
              metadata: {
                ...currentMeta,
                tags: updatedTags,
              },
            },
          });

          try {
            await qdrant.setPayload('memories', {
              payload: { 'metadata.tags': updatedTags },
              filter: {
                must: [{ key: 'memoryId', match: { value: memoryId } }],
              },
            });
          } catch (qErr) {
            console.warn('[AutomationProcessor] Qdrant tag sync warning:', qErr);
          }
          detail = `Tagged memory with ${newTag}`;
        } else {
          detail = `Memory already has tag ${newTag}`;
        }
      } else if (action === 'MOVE_FOLDER') {
        const destFolderId = (rule.actionConfig as any)?.folderId;
        if (destFolderId) {
          const folder = await prisma.folder.findFirst({ where: { id: destFolderId, userId } });
          if (!folder) {
            throw new Error(`Destination folder ${destFolderId} not found or not owned by user`);
          }
        }
        await prisma.memory.update({
          where: { id: memoryId },
          data: { folderId: destFolderId || null },
        });

        try {
          await qdrant.setPayload('memories', {
            payload: { folderId: destFolderId || null },
            filter: {
              must: [{ key: 'memoryId', match: { value: memoryId } }],
            },
          });
        } catch (qErr) {
          console.warn('[AutomationProcessor] Qdrant folderId sync warning:', qErr);
        }
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

  const executionStatus = result.results.length > 0 && result.results.every((r) => r.success) ? 'success' : 'failure';

  // Record execution log in Postgres
  await prisma.automationExecution.create({
    data: {
      ruleId,
      memoryId,
      status: executionStatus,
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
