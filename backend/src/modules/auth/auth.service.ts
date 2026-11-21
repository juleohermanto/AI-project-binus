import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/errors';
import { hashPassword, verifyPassword } from '../../lib/password';
import { prisma } from '../../lib/prisma';
import {
  issueTokenPair,
  revokeRefreshToken,
  rotateRefreshToken,
  type IssuedTokens,
} from '../../lib/tokens';
import { toUserDto, userSelect, type UserDto } from '../users/user.dto';
import type { LoginInput, SignupInput } from './auth.schema';

export interface AuthResult {
  user: UserDto;
  tokens: IssuedTokens;
}

let dummyPasswordHash: Promise<string> | undefined;

function getDummyPasswordHash(): Promise<string> {
  dummyPasswordHash ??= hashPassword('dummy-password-for-timing-equalization');
  return dummyPasswordHash;
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'Email sudah terdaftar');
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      select: userSelect,
    });

    const tokens = await issueTokenPair(user.id);

    return { user: toUserDto(user), tokens };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'Email sudah terdaftar');
    }

    throw error;
  }
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      ...userSelect,
      passwordHash: true,
    },
  });

  if (!user) {
    await verifyPassword(input.password, await getDummyPasswordHash());
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email atau password salah');
  }

  const isPasswordValid = await verifyPassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email atau password salah');
  }

  const tokens = await issueTokenPair(user.id);

  return {
    user: toUserDto({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }),
    tokens,
  };
}

export async function refresh(refreshToken: string): Promise<IssuedTokens> {
  return rotateRefreshToken(refreshToken);
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
}
