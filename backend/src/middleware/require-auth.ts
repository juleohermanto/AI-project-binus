import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { verifyAccessToken } from '../lib/tokens';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Header Authorization dengan Bearer token wajib dikirim');
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    throw new AppError(401, 'UNAUTHORIZED', 'Access token tidak boleh kosong');
  }

  const payload = verifyAccessToken(token);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Pengguna tidak ditemukan');
  }

  req.user = user;
  next();
}

export function getAuthUser(req: Request): NonNullable<Request['user']> {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Autentikasi diperlukan');
  }

  return req.user;
}
