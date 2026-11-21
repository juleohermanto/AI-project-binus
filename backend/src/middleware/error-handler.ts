import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function sendError(res: Response, statusCode: number, body: ErrorResponse): void {
  res.status(statusCode).json(body);
}

function isJsonParseError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as { type?: unknown }).type === 'entity.parse.failed'
  );
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    sendError(res, 422, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Data yang dikirim tidak valid',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      console.error(`[${error.code}]`, error.message);
    }

    sendError(res, error.statusCode, {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error('[DATABASE_UNAVAILABLE]', error.message);

    sendError(res, 503, {
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database tidak dapat diakses. Periksa konfigurasi DATABASE_URL.',
      },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      sendError(res, 409, {
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'Data dengan nilai tersebut sudah ada',
          details: error.meta,
        },
      });
      return;
    }

    if (error.code === 'P2025') {
      sendError(res, 404, {
        error: {
          code: 'NOT_FOUND',
          message: 'Data tidak ditemukan',
        },
      });
      return;
    }

    if (error.code === 'P2003') {
      sendError(res, 409, {
        error: {
          code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          message: 'Operasi melanggar relasi data',
        },
      });
      return;
    }
  }

  if (isJsonParseError(error)) {
    sendError(res, 400, {
      error: {
        code: 'INVALID_JSON',
        message: 'Body request bukan JSON yang valid',
      },
    });
    return;
  }

  console.error('[UNHANDLED_ERROR]', error);

  sendError(res, 500, {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Terjadi kesalahan pada server',
    },
  });
}
