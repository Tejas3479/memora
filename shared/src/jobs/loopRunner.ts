import { z } from 'zod';
import { LoopType, LoopStatus } from '../constants.js';

export const LOOP_RUNNER_QUEUE = 'loop-runner' as const;

export const loopTypeSchema = z.nativeEnum(LoopType);

export const loopTriggerSchema = z.object({
  loopType: loopTypeSchema,
  config: z.record(z.any()).optional().default({}),
  sync: z.boolean().optional().default(false),
});

export type LoopTriggerInput = z.infer<typeof loopTriggerSchema>;

export interface LoopRunnerPayload {
  userId: string;
  loopType: LoopType;
  executionId?: string;
  config?: Record<string, any>;
}

export interface LoopExecutionResponse {
  id: string;
  userId: string;
  loopType: LoopType;
  status: LoopStatus | string;
  input: Record<string, any>;
  output?: Record<string, any> | null;
  startedAt: string;
  completedAt?: string | null;
  error?: string | null;
}

export const LOOP_RUNNER_OPTIONS = {
  attempts: 2,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { age: 86400, count: 100 },
  removeOnFail: { age: 86400 * 7 },
} as const;
