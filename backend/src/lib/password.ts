import { compare, hash } from 'bcryptjs';
import { env } from '../config/env';

export function hashPassword(password: string): Promise<string> {
  return hash(password, env.BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}
