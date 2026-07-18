import { z } from 'zod';

export const commentCreateSchema = z.object({
  memoryId: z.string().uuid(),
  text: z.string().min(1),
  parentId: z.string().uuid().optional(),
});

export const commentUpdateSchema = z.object({
  text: z.string().min(1),
});

export type CommentCreateDto = z.infer<typeof commentCreateSchema>;
export type CommentUpdateDto = z.infer<typeof commentUpdateSchema>;
