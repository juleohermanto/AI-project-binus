import { z } from 'zod';

export const priorityLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export const taskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);

export const microStepInputSchema = z.object({
  title: z.string().trim().min(1, 'Judul micro-step wajib diisi').max(200, 'Judul micro-step maksimal 200 karakter'),
  description: z.string().trim().max(1000, 'Deskripsi micro-step maksimal 1000 karakter').optional().nullable(),
  estimatedMinutes: z.coerce
    .number()
    .int()
    .min(5, 'Estimasi micro-step minimal 5 menit')
    .max(15, 'Estimasi micro-step maksimal 15 menit'),
  order: z.coerce.number().int().min(0).max(100).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Judul tugas wajib diisi').max(200, 'Judul tugas maksimal 200 karakter'),
  description: z.string().trim().max(2000, 'Deskripsi maksimal 2000 karakter').optional().nullable(),
  category: z.string().trim().max(60, 'Kategori maksimal 60 karakter').optional().nullable(),
  estimatedMinutes: z.coerce
    .number()
    .int()
    .min(5, 'Estimasi tugas minimal 5 menit')
    .max(1440, 'Estimasi tugas maksimal 1440 menit'),
  priorityScore: z.coerce.number().int().min(0).max(100).default(50),
  priorityReason: z.string().trim().max(500, 'Alasan prioritas maksimal 500 karakter').optional().nullable(),
  deadline: z.string().trim().min(1, 'Deadline tidak boleh kosong').optional().nullable(),
  microSteps: z.array(microStepInputSchema).max(10, 'Maksimal 10 micro-step per tugas').optional().default([]),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1, 'Judul tugas wajib diisi').max(200, 'Judul tugas maksimal 200 karakter').optional(),
    description: z.string().trim().max(2000, 'Deskripsi maksimal 2000 karakter').optional().nullable(),
    category: z.string().trim().max(60, 'Kategori maksimal 60 karakter').optional().nullable(),
    estimatedMinutes: z.coerce.number().int().min(5).max(1440).optional(),
    priorityScore: z.coerce.number().int().min(0).max(100).optional(),
    priorityReason: z.string().trim().max(500).optional().nullable(),
    deadline: z.string().trim().min(1, 'Deadline tidak boleh kosong').optional().nullable(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Minimal satu field harus diisi',
  });

export const updateMicroStepSchema = z
  .object({
    title: z.string().trim().min(1, 'Judul micro-step wajib diisi').max(200).optional(),
    description: z.string().trim().max(1000).optional().nullable(),
    estimatedMinutes: z.coerce.number().int().min(5).max(15).optional(),
    order: z.coerce.number().int().min(0).max(100).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Minimal satu field harus diisi',
  });

export const listTasksQuerySchema = z.object({
  status: z.union([taskStatusSchema, z.literal('ALL')]).optional(),
  priority: priorityLevelSchema.optional(),
  category: z.string().trim().max(60).optional(),
  search: z.string().trim().max(200).optional(),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  timezone: z.string().trim().optional(),
  deadlineFrom: z.string().trim().optional(),
  deadlineTo: z.string().trim().optional(),
  sort: z.enum(['priority', 'deadline', 'createdAt', 'estimatedMinutes']).default('priority'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const taskParamsSchema = z.object({
  id: z.string().trim().min(1).max(64),
});

export const taskStepParamsSchema = z.object({
  id: z.string().trim().min(1).max(64),
  stepId: z.string().trim().min(1).max(64),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateMicroStepInput = z.infer<typeof updateMicroStepSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type MicroStepInput = z.infer<typeof microStepInputSchema>;
