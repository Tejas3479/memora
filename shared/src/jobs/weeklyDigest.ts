export const WEEKLY_DIGEST_QUEUE = 'weekly-digest' as const;

export interface WeeklyDigestPayload {
  userId: string;
  weekStart: string;
  weekEnd: string;
}

export interface WeeklyDigestResult {
  memoriesCount: number;
  topTopics: string[];
  summaryGenerated: boolean;
}

export const WEEKLY_DIGEST_OPTIONS = {
  repeat: { pattern: '0 9 * * 1' },
  removeOnComplete: { age: 604800, count: 10 },
  removeOnFail: { age: 604800 },
} as const;
