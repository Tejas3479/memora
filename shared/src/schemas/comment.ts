import { z } from 'zod';

export const commentCreateSchema = z.object({
  memoryId: z.string().uuid(),
  content: z.string().min(1),
  parentId: z.string().uuid().optional(),
});

export const commentUpdateSchema = z.object({
  content: z.string().min(1),
});

export type CommentCreateDto = z.infer<typeof commentCreateSchema>;
export type CommentUpdateDto = z.infer<typeof commentUpdateSchema>;
