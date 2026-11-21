import { env } from '../config/env';
import { AppError } from '../lib/errors';
import type { AiProvider } from './ai-provider';
import { GeminiAiProvider } from './gemini-provider';
import { MockAiProvider } from './mock-provider';

let cachedProvider: AiProvider | undefined;

export function getAiProvider(): AiProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  if (env.AI_PROVIDER === 'mock') {
    cachedProvider = new MockAiProvider();
    return cachedProvider;
  }

  if (!env.GEMINI_API_KEY.trim()) {
    throw new AppError(
      503,
      'AI_NOT_CONFIGURED',
      'GEMINI_API_KEY belum dikonfigurasi. Isi nilainya di .env atau set AI_PROVIDER=mock.',
    );
  }

  cachedProvider = new GeminiAiProvider(
    env.GEMINI_API_KEY.trim(),
    env.GEMINI_MODEL,
    env.GEMINI_API_BASE_URL,
    env.AI_TIMEOUT_MS,
  );

  return cachedProvider;
}
