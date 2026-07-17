import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { AutomationService } from '../services/domain/automation.js';
import { automationRuleCreateSchema, automationRuleUpdateSchema } from '@memora/shared';

export default async function automationsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/automations', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    return prisma.automationRule.findMany({ where: { userId } });
  });

  fastify.post('/api/automations', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const result = automationRuleCreateSchema.safeParse(request.body);
    if (!result.success) {
      throw new Error(result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    const { name, description, trigger, conditions, actions, actionConfig } = result.data;

    return prisma.automationRule.create({
      data: {
        userId,
        name,
        description,
        trigger,
        conditions: conditions || {},
        actions: actions || [],
        actionConfig: actionConfig || {},
      },
    });
  });

  fastify.put('/api/automations/:id', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { id } = request.params as any;
    const result = automationRuleUpdateSchema.safeParse(request.body);
    if (!result.success) {
      throw new Error(result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    const body = result.data;

    const exists = await prisma.automationRule.findFirst({ where: { id, userId } });
    if (!exists) throw new Error('Rule not found');

    return prisma.automationRule.update({
      where: { id },
      data: {
        name: body.name ?? exists.name,
        description: body.description ?? exists.description,
        trigger: body.trigger ?? exists.trigger,
        conditions: body.conditions ?? exists.conditions,
        actions: body.actions ?? exists.actions,
        actionConfig: body.actionConfig ?? exists.actionConfig,
        enabled: body.enabled ?? exists.enabled,
      },
    });
  });

  fastify.delete('/api/automations/:id', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { id } = request.params as any;

    const exists = await prisma.automationRule.findFirst({ where: { id, userId } });
    if (!exists) throw new Error('Rule not found');

    await prisma.automationRule.delete({ where: { id } });
    return { success: true };
  });

  fastify.get('/api/automations/:id/executions', { preHandler: authMiddleware }, async (request) => {
    const { id } = request.params as any;
    const auto = new AutomationService(prisma);
    return auto.getRuleExecutions(id);
  });

  fastify.post('/api/automations/:id/test', { preHandler: authMiddleware }, async (request) => {
    const { id } = request.params as any;
    const { memoryId } = request.body as any;
    const auto = new AutomationService(prisma);
    return auto.executeAction(id, memoryId);
  });
}
