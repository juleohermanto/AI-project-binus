import { DateTime } from 'luxon';
import { z } from 'zod';
import { isRecord } from '../../lib/errors';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

const optionalText = (maxLength: number, fallback = '') =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (typeof value === 'string' ? value.trim().slice(0, maxLength) : fallback));

const aiMicroStepSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Judul micro-step wajib diisi')
    .transform((value) => value.slice(0, 200)),
  estimatedMinutes: z.coerce.number().int().transform((value) => clamp(value, 5, 15)),
});

const deadlineSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null))
  .refine((value) => value === null || DateTime.fromISO(value).isValid, {
    message: 'deadline harus berupa string ISO 8601 atau null',
  });

const aiTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Judul tugas wajib diisi')
    .transform((value) => value.slice(0, 200)),
  description: optionalText(2000),
  category: optionalText(60, 'Lainnya'),
  estimatedMinutes: z.coerce.number().int().transform((value) => clamp(value, 5, 1440)),
  priorityScore: z.coerce.number().int().transform((value) => clamp(value, 0, 100)),
  priorityReason: optionalText(500),
  deadline: deadlineSchema,
  firstMicroStep: aiMicroStepSchema,
  additionalSteps: z
    .array(aiMicroStepSchema)
    .optional()
    .default([])
    .transform((steps) => steps.slice(0, 8)),
});

export const aiBrainDumpSchema = z.object({
  tasks: z
    .array(aiTaskSchema)
    .min(1, 'AI harus mengembalikan minimal satu tugas')
    .transform((tasks) => tasks.slice(0, 10)),
});

export type AiBrainDumpResult = z.infer<typeof aiBrainDumpSchema>;
export type AiTask = z.infer<typeof aiTaskSchema>;

export function normalizeAiBrainDumpPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return { tasks: payload };
  }

  if (isRecord(payload)) {
    if (Array.isArray(payload.tasks)) {
      return payload;
    }

    if (isRecord(payload.data) && Array.isArray(payload.data.tasks)) {
      return payload.data;
    }
  }

  return payload;
}
