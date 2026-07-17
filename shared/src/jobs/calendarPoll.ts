export const CALENDAR_POLL_QUEUE = 'calendar-poll' as const;

export interface CalendarPollPayload {
  userId: string;
  integrationId: string;
  syncSince?: string;
}

export interface CalendarPollResult {
  eventsProcessed: number;
  errors: string[];
}

export const CALENDAR_POLL_OPTIONS: {
  readonly repeat: { readonly every: 300000 };
  readonly removeOnComplete: { readonly age: 3600; readonly count: 100 };
  readonly removeOnFail: { readonly age: 86400 };
} = {
  repeat: { every: 300000 },
  removeOnComplete: { age: 3600, count: 100 },
  removeOnFail: { age: 86400 },
} as const;
