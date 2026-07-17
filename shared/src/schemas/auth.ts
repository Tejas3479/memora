import { z } from 'zod';

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export type LoginRequestDto = z.infer<typeof loginRequestSchema>;
export type RegisterRequestDto = z.infer<typeof registerRequestSchema>;
