import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

const rateLimitBody = (code: string, message: string) => ({
  error: { code, message },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitBody('RATE_LIMITED', 'Terlalu banyak percobaan autentikasi. Coba lagi dalam 15 menit.'),
});

export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitBody('RATE_LIMITED', 'Terlalu banyak permintaan refresh token. Coba lagi nanti.'),
});

export const brainDumpRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? 'unknown'),
  message: rateLimitBody('RATE_LIMITED', 'Batas Brain Dump tercapai. Coba lagi dalam 1 jam.'),
});
