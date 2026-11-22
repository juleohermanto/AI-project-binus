import { createHash, randomUUID } from 'node:crypto';
import { type Prisma } from '@prisma/client';
import jwt, { type JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errors';
import { prisma } from './prisma';

const ISSUER = 'productivity-assistant';
const AUDIENCE = 'productivity-assistant-api';
const ACCESS_TOKEN_TYPE = 'access';
const REFRESH_TOKEN_TYPE = 'refresh';

export const REFRESH_COOKIE_NAME = 'refresh_token';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

interface AccessTokenPayload extends JwtPayload {
  sub: string;
  type: typeof ACCESS_TOKEN_TYPE;
}

interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  type: typeof REFRESH_TOKEN_TYPE;
  jti: string;
}

type RefreshTokenWriter = Pick<Prisma.TransactionClient, 'refreshToken'>;

function assertPayload(payload: string | JwtPayload): asserts payload is JwtPayload {
  if (typeof payload === 'string') {
    throw new AppError(401, 'INVALID_TOKEN', 'Token payload is invalid');
  }
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, type: ACCESS_TOKEN_TYPE }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL_MINUTES * 60,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    assertPayload(payload);

    if (payload.type !== ACCESS_TOKEN_TYPE || typeof payload.sub !== 'string') {
      throw new AppError(401, 'INVALID_ACCESS_TOKEN', 'Access token is invalid');
    }

    return payload as AccessTokenPayload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof TokenExpiredError) {
      throw new AppError(401, 'ACCESS_TOKEN_EXPIRED', 'Access token has expired');
    }

    throw new AppError(401, 'INVALID_ACCESS_TOKEN', 'Access token is invalid');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    assertPayload(payload);

    if (
      payload.type !== REFRESH_TOKEN_TYPE ||
      typeof payload.sub !== 'string' ||
      typeof payload.jti !== 'string'
    ) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid');
    }

    return payload as RefreshTokenPayload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof TokenExpiredError) {
      throw new AppError(401, 'REFRESH_TOKEN_EXPIRED', 'Refresh token has expired');
    }

    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid');
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function issueTokenPair(
  userId: string,
  client: RefreshTokenWriter = prisma,
): Promise<IssuedTokens> {
  const now = Date.now();
  const accessTokenExpiresAt = new Date(now + env.ACCESS_TOKEN_TTL_MINUTES * 60_000);
  const refreshTokenExpiresAt = new Date(now + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);

  const accessToken = signAccessToken(userId);
  const jti = randomUUID();

  const refreshToken = jwt.sign(
    { sub: userId, type: REFRESH_TOKEN_TYPE, jti },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_TTL_DAYS * 86_400,
      issuer: ISSUER,
      audience: AUDIENCE,
    },
  );

  await client.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
}

export async function rotateRefreshToken(refreshToken: string): Promise<IssuedTokens> {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, revokedAt: true },
  });

  if (
    !storedToken ||
    storedToken.userId !== payload.sub ||
    storedToken.revokedAt !== null ||
    storedToken.expiresAt.getTime() <= Date.now()
  ) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is no longer valid');
  }

  return prisma.$transaction(async (transaction) => {
    const revoked = await transaction.refreshToken.updateMany({
      where: { id: storedToken.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (revoked.count !== 1) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is no longer valid');
    }

    return issueTokenPair(storedToken.userId, transaction);
  });
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
