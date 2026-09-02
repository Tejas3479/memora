import { z } from 'zod';

export const settingsUpdateSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.boolean().optional(),
  autoCapture: z.boolean().optional(),
  excludedDomains: z.array(z.string()).optional(),
  retentionDays: z.number().int().min(1).max(3650).optional(),
  language: z.string().max(10).optional(),
  searchPreferences: z.record(z.any()).optional(),
}).passthrough();

export type SettingsUpdateDto = z.infer<typeof settingsUpdateSchema>;
