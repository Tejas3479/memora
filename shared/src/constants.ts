// ─── Billing ─────────────────────────────────────────────────────────────────

export enum Plan {
  FREE = 'FREE',
  PRO = 'PRO',
  TEAM = 'TEAM',
}

export enum SubscriptionStatus {
  INCOMPLETE = 'INCOMPLETE',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
}

// ─── Memory Sources ──────────────────────────────────────────────────────────

export enum MemorySource {
  WEB = 'WEB',
  SLACK = 'SLACK',
  NOTION = 'NOTION',
  GITHUB = 'GITHUB',
  GOOGLE_DRIVE = 'GOOGLE_DRIVE',
  DOCUMENT = 'DOCUMENT',
  SCREENSHOT = 'SCREENSHOT',
  AUDIO = 'AUDIO',
  IMAGE = 'IMAGE',
  NOTE = 'NOTE',
  CALENDAR = 'CALENDAR',
  EMAIL = 'EMAIL',
}

// ─── Integrations ────────────────────────────────────────────────────────────

export enum IntegrationProvider {
  SLACK = 'SLACK',
  NOTION = 'NOTION',
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

// ─── Knowledge Graph ─────────────────────────────────────────────────────────

export enum GraphNodeType {
  MEMORY = 'MEMORY',
  PERSON = 'PERSON',
  TOPIC = 'TOPIC',
  ENTITY = 'ENTITY',
  CONCEPT = 'CONCEPT',
  EVENT = 'EVENT',
}

export enum GraphEdgeType {
  MENTIONS = 'MENTIONS',
  RELATES_TO = 'RELATES_TO',
  CREATED_BY = 'CREATED_BY',
  TAGGED_WITH = 'TAGGED_WITH',
  OCCURRED_AT = 'OCCURRED_AT',
  LINKS_TO = 'LINKS_TO',
}

// ─── Cognitive Loops ─────────────────────────────────────────────────────────

export enum LoopType {
  SELF_REFLECTION = 'SELF_REFLECTION',
  CONSOLIDATION = 'CONSOLIDATION',
  EVALUATION = 'EVALUATION',
  MULTI_AGENT = 'MULTI_AGENT',
  DREAMING = 'DREAMING',
}

export enum LoopStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ─── Automations ─────────────────────────────────────────────────────────────

export enum AutomationTrigger {
  ON_INGEST = 'ON_INGEST',
  ON_SEARCH = 'ON_SEARCH',
  SCHEDULED = 'SCHEDULED',
  ON_TAG = 'ON_TAG',
  ON_SOURCE = 'ON_SOURCE',
  MANUAL = 'MANUAL',
}

export enum AutomationAction {
  TAG = 'TAG',
  MOVE_FOLDER = 'MOVE_FOLDER',
  NOTIFY = 'NOTIFY',
  ENRICH = 'ENRICH',
  SUMMARIZE = 'SUMMARIZE',
  EXTRACT_ENTITIES = 'EXTRACT_ENTITIES',
  LINK_PEOPLE = 'LINK_PEOPLE',
}

// ─── Browser Extension ───────────────────────────────────────────────────────

export enum BrowserAction {
  CAPTURE_PAGE = 'CAPTURE_PAGE',
  CAPTURE_SELECTION = 'CAPTURE_SELECTION',
  CAPTURE_SCREENSHOT = 'CAPTURE_SCREENSHOT',
  OPEN_SIDEBAR = 'OPEN_SIDEBAR',
  TOGGLE_AUTOCAPTURE = 'TOGGLE_AUTOCAPTURE',
}

// ─── Plan Limits ─────────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  FREE: { memoriesPerMonth: 1000, searchesPerDay: 50, integrations: 1 },
  PRO: { memoriesPerMonth: 50000, searchesPerDay: 1000, integrations: 10 },
  TEAM: { memoriesPerMonth: 200000, searchesPerDay: 5000, integrations: 50 },
} as const;

// ─── RAG / Embedding ─────────────────────────────────────────────────────────

export const CHUNK_CONFIG = {
  chunkSize: 500,
  chunkOverlap: 50,
  separators: ['\n\n', '\n', '. ', '? ', '! '],
} as const;

export const EMBEDDING_DIMENSION = 1024 as const;

export const QDRANT_COLLECTION = 'memories' as const;

// ─── Resilience ──────────────────────────────────────────────────────────────

export const MAX_RETRY_ATTEMPTS = 3 as const;

// ─── Browser Extension Allowlist ─────────────────────────────────────────────

export const BROWSER_ACTIONS_ALLOWLIST: BrowserAction[] = [
  BrowserAction.CAPTURE_PAGE,
  BrowserAction.CAPTURE_SELECTION,
  BrowserAction.CAPTURE_SCREENSHOT,
  BrowserAction.OPEN_SIDEBAR,
  BrowserAction.TOGGLE_AUTOCAPTURE,
];
