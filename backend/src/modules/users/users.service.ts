import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/errors';
import { hashPassword, verifyPassword } from '../../lib/password';
import { prisma } from '../../lib/prisma';
import {
  issueTokenPair,
  revokeAllRefreshTokens,
  type IssuedTokens,
} from '../../lib/tokens';
import { toUserDto, userSelect, type UserDto } from './user.dto';
import type { ChangePasswordInput, UpdateProfileInput } from './users.schema';

export async function getProfile(userId: string): Promise<UserDto> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan');
  }

  return toUserDto(user);
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserDto> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
      },
      select: userSelect,
    });

    return toUserDto(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'Email sudah terdaftar');
      }

      if (error.code === 'P2025') {
        throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan');
      }
    }

    throw error;
  }
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<IssuedTokens> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan');
  }

  const isCurrentPasswordValid = await verifyPassword(input.currentPassword, user.passwordHash);

  if (!isCurrentPasswordValid) {
    throw new AppError(400, 'INVALID_CURRENT_PASSWORD', 'Password saat ini salah');
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await revokeAllRefreshTokens(userId);

  return issueTokenPair(userId);
}
