import type { Request, Response } from 'express';
import { setRefreshCookie } from '../../lib/cookies';
import { getAuthUser } from '../../middleware/require-auth';
import { changePasswordSchema, updateProfileSchema } from './users.schema';
import * as usersService from './users.service';

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const profile = await usersService.getProfile(user.id);

  res.status(200).json({ data: profile });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const input = updateProfileSchema.parse(req.body);
  const profile = await usersService.updateProfile(user.id, input);

  res.status(200).json({ data: profile });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const input = changePasswordSchema.parse(req.body);
  const tokens = await usersService.changePassword(user.id, input);

  setRefreshCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

  res.status(200).json({
    data: {
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
    },
  });
}
