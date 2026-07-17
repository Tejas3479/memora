import { z } from 'zod';
import { TeamRole } from '../constants';

export const teamCreateSchema = z.object({
  name: z.string().min(1),
});

export const teamInviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(TeamRole).optional(),
});

export const teamUpdateSchema = z.object({
  name: z.string().min(1).optional(),
});

export type TeamCreateDto = z.infer<typeof teamCreateSchema>;
export type TeamInviteDto = z.infer<typeof teamInviteSchema>;
export type TeamUpdateDto = z.infer<typeof teamUpdateSchema>;
