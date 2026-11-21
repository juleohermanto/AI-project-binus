import { AppError } from '../lib/errors';
import type { AiGenerationRequest, AiProvider } from './ai-provider';

interface GeminiPart {
  text?: string;
  thought?: boolean;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
}

export class GeminiAiProvider implements AiProvider {
  readonly name = 'gemini';

  constructor(
    private readonly apiKey: string,
    readonly model: string,
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  async generate(request: AiGenerationRequest): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = `${this.baseUrl.replace(/\/+$/, '')}/v1beta/models/${encodeURIComponent(this.model)}:generateContent`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: request.systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: request.userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      const rawBody = await response.text();

      if (!response.ok) {
        let upstreamMessage: string | undefined;

        try {
          const parsed = JSON.parse(rawBody) as { error?: { message?: string } };
          upstreamMessage = parsed.error?.message;
        } catch {
          upstreamMessage = undefined;
        }

        throw new AppError(
          502,
          'AI_UPSTREAM_ERROR',
          upstreamMessage
            ? `Gemini API: ${truncate(upstreamMessage, 300)}`
            : `Gemini API merespons dengan status ${response.status}`,
        );
      }

      let payload: GeminiResponse;

      try {
        payload = JSON.parse(rawBody) as GeminiResponse;
      } catch {
        throw new AppError(502, 'AI_INVALID_RESPONSE', 'Respons Gemini bukan JSON yang valid');
      }

      if (payload.promptFeedback?.blockReason) {
        throw new AppError(
          502,
          'AI_BLOCKED',
          `Gemini menolak memproses input (${payload.promptFeedback.blockReason})`,
        );
      }

      const candidate = payload.candidates?.[0];

      if (candidate?.finishReason === 'SAFETY') {
        throw new AppError(502, 'AI_BLOCKED', 'Gemini menolak memproses input karena kebijakan keamanan');
      }

      const text = (candidate?.content?.parts ?? [])
        .filter((part) => part.thought !== true)
        .map((part) => part.text ?? '')
        .join('')
        .trim();

      if (!text) {
        throw new AppError(502, 'AI_EMPTY_RESPONSE', 'Gemini tidak mengembalikan konten');
      }

      return text;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError') {
        throw new AppError(504, 'AI_TIMEOUT', 'Permintaan ke Gemini melebihi batas waktu');
      }

      throw new AppError(502, 'AI_UPSTREAM_ERROR', 'Gagal menghubungi Gemini API');
    } finally {
      clearTimeout(timeout);
    }
  }
}
