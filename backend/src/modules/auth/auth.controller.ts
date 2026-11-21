import type { Request, Response } from 'express';
import { clearRefreshCookie, setRefreshCookie } from '../../lib/cookies';
import { AppError } from '../../lib/errors';
import { REFRESH_COOKIE_NAME, type IssuedTokens } from '../../lib/tokens';
import { loginSchema, refreshTokenSchema, signupSchema } from './auth.schema';
import * as authService from './auth.service';

function readRefreshToken(req: Request, bodyToken?: string): string | undefined {
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (bodyToken) {
    return bodyToken;
  }

  return typeof cookieToken === 'string' && cookieToken.length > 0 ? cookieToken : undefined;
}

function tokenResponse(tokens: IssuedTokens) {
  return {
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
  };
}

export async function signup(req: Request, res: Response): Promise<void> {
  const input = signupSchema.parse(req.body);
  const result = await authService.signup(input);

  setRefreshCookie(res, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt);

  res.status(201).json({
    data: {
      user: result.user,
      ...tokenResponse(result.tokens),
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);

  setRefreshCookie(res, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt);

  res.status(200).json({
    data: {
      user: result.user,
      ...tokenResponse(result.tokens),
    },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const body = refreshTokenSchema.parse(req.body ?? {});
  const refreshToken = readRefreshToken(req, body.refreshToken);

  if (!refreshToken) {
    throw new AppError(401, 'REFRESH_TOKEN_MISSING', 'Refresh token tidak ditemukan');
  }

  const tokens = await authService.refresh(refreshToken);

  setRefreshCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

  res.status(200).json({
    data: tokenResponse(tokens),
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const body = refreshTokenSchema.parse(req.body ?? {});
  const refreshToken = readRefreshToken(req, body.refreshToken);

  await authService.logout(refreshToken);
  clearRefreshCookie(res);

  res.status(200).json({
    data: { loggedOut: true },
  });
}
