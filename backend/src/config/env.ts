import 'dotenv/config';
import { IANAZone } from 'luxon';
import { z } from 'zod';

const booleanFromEnv = (defaultValue: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(defaultValue)
    .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(7),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),

  COOKIE_SECURE: booleanFromEnv('false'),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().optional(),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  AI_PROVIDER: z.enum(['gemini', 'mock']).default('gemini'),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_API_BASE_URL: z.string().url().default('https://generativelanguage.googleapis.com'),
  AI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(45000),

  APP_TIMEZONE: z
    .string()
    .default('Asia/Jakarta')
    .refine((timeZone) => IANAZone.isValidZone(timeZone), 'APP_TIMEZONE must be a valid IANA timezone'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;

export const allowedOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (env.COOKIE_SAMESITE === 'none' && !env.COOKIE_SECURE) {
  throw new Error('COOKIE_SAMESITE=none requires COOKIE_SECURE=true');
}
