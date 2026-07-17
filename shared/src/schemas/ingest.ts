import { z } from 'zod';
import { MemorySource } from '../constants';

export const ingestBodySchema = z.object({
  content: z.string().min(10),
  url: z.string().url(),
  source: z.nativeEnum(MemorySource),
  title: z.string().min(1),
  timestamp: z.string(), // accepting ISO-8601 strings
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().optional(),
});

export const ingestResponseSchema = z.object({
  success: z.boolean(),
  memoryId: z.string().uuid(),
  chunksCreated: z.number().int(),
  status: z.string(),
});

export type IngestBodyDto = z.infer<typeof ingestBodySchema>;
export type IngestResponseDto = z.infer<typeof ingestResponseSchema>;
