export interface Person {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  company?: string;
  role?: string;
  notes?: string;
  firstSeen: Date;
  lastSeen: Date;
  memoryCount: number;
  metadata?: Record<string, unknown>;
}

export interface PersonMention {
  personId: string;
  memoryId: string;
  context: string;
  timestamp: Date;
}

export interface PersonCreateRequest {
  name: string;
  email?: string;
  company?: string;
  role?: string;
  notes?: string;
}

export type PersonUpdateRequest = Partial<PersonCreateRequest>;

export type PersonWithMentions = Person & { mentions: PersonMention[] };
