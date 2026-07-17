export const AUTOMATION_RUNNER_QUEUE = 'automation-runner' as const;

export interface AutomationRunnerPayload {
  ruleId: string;
  memoryId: string;
  userId: string;
  trigger: string;
}

export interface AutomationRunnerResult {
  actionsExecuted: number;
  results: Array<{ action: string; success: boolean; detail?: string }>;
}

export const AUTOMATION_RUNNER_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { age: 3600, count: 200 },
  removeOnFail: { age: 86400 },
} as const;
