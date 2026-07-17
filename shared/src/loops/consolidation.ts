export interface ConsolidationInput {
  userId: string;
  scope: 'daily' | 'weekly' | 'monthly';
  cutoffDate: string;
}

export interface ConsolidationOutput {
  summariesCreated: number;
  memoriesMerged: number;
  duplicatesRemoved: number;
  newGraphEdges: number;
}

export type ConsolidationStrategy = 'temporal' | 'topical' | 'source-based';

export const CONSOLIDATION_CONFIG = {
  strategies: ['temporal', 'topical', 'source-based'] as const,
  similarityThreshold: 0.85,
  minClusterSize: 3,
  maxSummaryLength: 500,
  schedules: {
    daily: '0 2 * * *',
    weekly: '0 3 * * 0',
    monthly: '0 4 1 * *',
  },
} as const;
