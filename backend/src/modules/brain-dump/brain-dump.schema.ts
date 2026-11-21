import { z } from 'zod';

export const brainDumpRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(10, 'Tuliskan setidaknya 10 karakter agar AI dapat memahami konteks')
    .max(5000, 'Brain dump maksimal 5000 karakter'),
  timezone: z.string().trim().optional(),
});

export type BrainDumpInput = z.infer<typeof brainDumpRequestSchema>;
