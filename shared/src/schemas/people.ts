import { z } from 'zod';

export const personCreateSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email().optional().or(z.literal('')),
  company: z.string().max(150).optional(),
  role: z.string().max(150).optional(),
  notes: z.string().max(5000).optional(),
});

export const personUpdateSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  email: z.string().email().optional().or(z.literal('')),
  company: z.string().max(150).optional(),
  role: z.string().max(150).optional(),
  notes: z.string().max(5000).optional(),
});

export type PersonCreateDto = z.infer<typeof personCreateSchema>;
export type PersonUpdateDto = z.infer<typeof personUpdateSchema>;
