import { z } from 'zod';

export const summarizeRequestSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  content: z.string().min(10),
});

export const pageSummarySchema = z.object({
  tldr: z.string(),
  keyPoints: z.array(z.string()),
  tags: z.array(z.string()),
});

export const summarizeResponseSchema = z.object({
  success: z.boolean(),
  summary: pageSummarySchema,
  memoryId: z.string(),
});

export type SummarizeRequestDto = z.infer<typeof summarizeRequestSchema>;
export type SummarizeResponseDto = z.infer<typeof summarizeResponseSchema>;
export type PageSummaryDto = z.infer<typeof pageSummarySchema>;
