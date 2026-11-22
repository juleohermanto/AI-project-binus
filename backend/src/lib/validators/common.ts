import { z } from 'zod';

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Nama minimal 2 karakter')
  .max(80, 'Nama maksimal 80 karakter');

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email wajib diisi')
  .max(254, 'Email maksimal 254 karakter')
  .email('Format email tidak valid')
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .max(72, 'Password maksimal 72 karakter');

export const idSchema = z.string().trim().min(1, 'ID wajib diisi').max(64, 'ID tidak valid');

export const idParamSchema = z.object({ id: idSchema });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function buildPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
