import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { config } from '../../config.js';
import { AUTOMATION_RUNNER_QUEUE } from '@memora/shared';

export class AutomationService {
  private queue: Queue | null = null;

  constructor(
    private prisma: PrismaClient,
  ) {
    try {
      this.queue = new Queue(AUTOMATION_RUNNER_QUEUE, {
        connection: {
          url: config.redis.url,
        },
      });
    } catch (err) {
      console.warn('[AutomationService] Failed to establish BullMQ Queue connection:', err);
    }
  }

  public async evaluateRules(
    userId: string,
    memoryId: string,
    trigger: string,
    memoryData: Record<string, any>,
  ): Promise<void> {
    const rules = await this.prisma.automationRule.findMany({
      where: {
        userId,
        trigger,
        enabled: true,
      },
    });

    for (const rule of rules) {
      const isMatch = this.matchConditions(rule.conditions as Record<string, any>, memoryData);
      if (isMatch && this.queue) {
        await this.queue.add(`run-${rule.id}`, {
          ruleId: rule.id,
          memoryId,
          userId,
          trigger,
        });
      }
    }
  }

  public matchConditions(conditions: Record<string, any>, memoryData: Record<string, any>): boolean {
    if (!conditions) return true;

    // source matches
    if (conditions.source && memoryData.source !== conditions.source) {
      return false;
    }

    // keyword matches
    if (conditions.containsKeyword) {
      const text = `${memoryData.title || ''} ${memoryData.content || ''}`.toLowerCase();
      if (!text.includes(conditions.containsKeyword.toLowerCase())) {
        return false;
      }
    }

    // tag matches
    if (conditions.hasTag) {
      const tags = (memoryData.metadata?.tags || []) as string[];
      if (!tags.includes(conditions.hasTag)) {
        return false;
      }
    }

    return true;
  }

  public async executeAction(ruleId: string, memoryId: string): Promise<any> {
    const rule = await this.prisma.automationRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new Error('Rule not found');

    const result = {
      ruleId,
      memoryId,
      status: 'success',
      actionsExecuted: [] as string[],
    };

    // Simulated actions execution
    const actions = rule.actions as string[];
    for (const action of actions) {
      result.actionsExecuted.push(action);
      // In worker, actual changes to vector DB or metadata will occur
    }

    await this.prisma.automationExecution.create({
      data: {
        ruleId,
        memoryId,
        status: 'success',
        result,
      },
    });

    await this.prisma.automationRule.update({
      where: { id: ruleId },
      data: {
        executionCount: { increment: 1 },
        lastExecutedAt: new Date(),
      },
    });

    return result;
  }

  public async getRuleExecutions(ruleId: string, limit = 10): Promise<any[]> {
    return this.prisma.automationExecution.findMany({
      where: { ruleId },
      orderBy: { executedAt: 'desc' },
      take: limit,
    });
  }
}
export default AutomationService;
