import { z } from 'zod';
import { AutomationTrigger, AutomationAction } from '../constants';

export const automationConditionsSchema = z.object({
  sourceMatch: z.array(z.string()).optional(),
  keywordMatch: z.array(z.string()).optional(),
  tagMatch: z.array(z.string()).optional(),
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }).optional(),
  customLogic: z.string().optional(),
});

export const automationActionConfigSchema = z.object({
  tagName: z.string().optional(),
  folderId: z.string().optional(),
  notificationChannel: z.string().optional(),
  enrichmentType: z.string().optional(),
}).catchall(z.unknown());

export const automationRuleCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  trigger: z.nativeEnum(AutomationTrigger),
  conditions: automationConditionsSchema,
  actions: z.array(z.nativeEnum(AutomationAction)).min(1),
  actionConfig: automationActionConfigSchema,
});

export const automationRuleUpdateSchema = automationRuleCreateSchema.partial().extend({
  enabled: z.boolean().optional(),
});

export type AutomationRuleCreateDto = z.infer<typeof automationRuleCreateSchema>;
export type AutomationRuleUpdateDto = z.infer<typeof automationRuleUpdateSchema>;
