import { AutomationTrigger, AutomationAction } from '../constants';

export interface AutomationConditions {
  sourceMatch?: string[];
  keywordMatch?: string[];
  tagMatch?: string[];
  dateRange?: { from: string; to: string };
  customLogic?: string;
}

export interface AutomationActionConfig {
  tagName?: string;
  folderId?: string;
  notificationChannel?: string;
  enrichmentType?: string;
  [key: string]: unknown;
}

export interface AutomationRule {
  id: string;
  userId: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions: AutomationConditions;
  actions: AutomationAction[];
  actionConfig: AutomationActionConfig;
  enabled: boolean;
  executionCount: number;
  lastExecutedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  memoryId?: string;
  status: 'success' | 'failure' | 'skipped';
  result?: Record<string, unknown>;
  error?: string;
  executedAt: Date;
}

export interface AutomationRuleCreateRequest {
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions: AutomationConditions;
  actions: AutomationAction[];
  actionConfig: AutomationActionConfig;
}

export type AutomationRuleUpdateRequest = Partial<AutomationRuleCreateRequest> & {
  enabled?: boolean;
};
