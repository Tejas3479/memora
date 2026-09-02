import { z } from 'zod';

export const folderCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const folderUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const folderAddMemoriesSchema = z.object({
  memoryIds: z.array(z.string().min(1)).min(1),
});

export type FolderCreateDto = z.infer<typeof folderCreateSchema>;
export type FolderUpdateDto = z.infer<typeof folderUpdateSchema>;
export type FolderAddMemoriesDto = z.infer<typeof folderAddMemoriesSchema>;
