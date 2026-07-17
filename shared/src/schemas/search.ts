import { z } from 'zod';
import { MemorySource } from '../constants';

export const searchFiltersSchema = z.object({
  source: z.nativeEnum(MemorySource).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().optional(),
});

export const searchBodySchema = z.object({
  query: z.string().min(1),
  filters: searchFiltersSchema.optional(),
  limit: z.number().int().min(1).max(50).default(10),
  offset: z.number().int().min(0).default(0),
});

export const searchResultSchema = z.object({
  id: z.string(),
  content: z.string(),
  title: z.string(),
  url: z.string(),
  source: z.nativeEnum(MemorySource),
  timestamp: z.string(),
  score: z.number(),
  chunkId: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export const sourceReferenceSchema = z.object({
  url: z.string(),
  title: z.string(),
  chunkId: z.string(),
  snippet: z.string(),
});

export const synthesizedAnswerSchema = z.object({
  answer: z.string(),
  sources: z.array(sourceReferenceSchema),
  confidence: z.number(),
});

export const searchResponseSchema = z.object({
  results: z.array(searchResultSchema),
  synthesizedAnswer: synthesizedAnswerSchema.optional(),
  total: z.number().int(),
  took: z.number(),
});

export type SearchBodyDto = z.infer<typeof searchBodySchema>;
export type SearchResponseDto = z.infer<typeof searchResponseSchema>;
