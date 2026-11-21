import { z } from 'zod';

export const overviewQuerySchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  timezone: z.string().trim().optional(),
});

export type OverviewQuery = z.infer<typeof overviewQuerySchema>;
