import { MemorySource } from '../constants';

export interface SearchFilters {
  source?: MemorySource;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  folderId?: string;
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface Memory {
  id: string;
  userId: string;
  title: string;
  content: string;
  source: MemorySource | string;
  url: string;
  metadata?: Record<string, unknown>;
  folderId?: string | null;
  teamId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SearchResult {
  id: string;
  content: string;
  title: string;
  url: string;
  source: MemorySource | string;
  timestamp: string | number;
  score?: number;
  chunkId: string;
  metadata?: Record<string, unknown>;
}

export interface SourceReference {
  url: string;
  title: string;
  chunkId: string;
  snippet: string;
}

export interface SynthesizedAnswer {
  answer: string;
  sources: SourceReference[];
  confidence: number;
}

export interface SearchResponse {
  results: SearchResult[];
  synthesizedAnswer?: SynthesizedAnswer;
  total: number;
  took: number;
}

export interface HybridSearchParams {
  vector: number[];
  query: string;
  userId: string;
  filters?: SearchFilters;
  limit?: number;
}

export interface TimelineRequest {
  limit?: number;
  offset?: number;
  source?: MemorySource;
  folderId?: string;
}

export interface TimelineResponse {
  items: SearchResult[];
  total: number;
  hasMore: boolean;
}
