import { z } from 'zod';

export const createHighlightSchema = z.object({
  url: z.string().url(),
  text: z.string().min(1),
  note: z.string().optional(),
  color: z.string().default('yellow'),
  memoryId: z.string().optional(),
});

export const highlightResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  url: z.string(),
  text: z.string(),
  note: z.string().nullable(),
  color: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  memoryId: z.string().nullable(),
});

export type CreateHighlightDto = z.infer<typeof createHighlightSchema>;
export type HighlightResponseDto = z.infer<typeof highlightResponseSchema>;
