import { z } from 'zod';

export const createFocusSessionSchema = z.object({
  taskId: z.string().trim().min(1, 'taskId wajib diisi').max(64),
  microStepId: z.string().trim().min(1).max(64).optional().nullable(),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(5, 'Durasi fokus minimal 5 menit')
    .max(15, 'Durasi fokus maksimal 15 menit'),
});

export const completeFocusSessionSchema = z.object({
  completeMicroStep: z.boolean().default(false),
});

export const listFocusSessionsQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'ALL']).optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const focusSessionParamsSchema = z.object({
  id: z.string().trim().min(1).max(64),
});

export type CreateFocusSessionInput = z.infer<typeof createFocusSessionSchema>;
export type CompleteFocusSessionInput = z.infer<typeof completeFocusSessionSchema>;
export type ListFocusSessionsQuery = z.infer<typeof listFocusSessionsQuerySchema>;
