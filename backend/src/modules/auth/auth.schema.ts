import { z } from 'zod';
import { emailSchema, nameSchema, passwordSchema } from '../../lib/validators/common';

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password wajib diisi').max(72, 'Password maksimal 72 karakter'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token tidak valid').optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
