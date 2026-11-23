/// <reference types="node" />

import {
  BrainDumpRequest,
  BrainDumpResponse,
  ExtractedTask,
  MOCK_BRAIN_DUMP_RESPONSE,
  TaskPriority,
} from "./schema";
import {
  BRAIN_DUMP_SYSTEM_PROMPT,
  buildBrainDumpUserPrompt,
} from "./systemPrompt";

export {
  BRAIN_DUMP_SYSTEM_PROMPT,
  buildBrainDumpUserPrompt,
  MOCK_BRAIN_DUMP_RESPONSE,
};
export type {
  BrainDumpRequest,
  BrainDumpResponse,
  ExtractedTask,
  TaskPriority,
};

const VALID_PRIORITIES: TaskPriority[] = ["high", "medium", "low"];
const TRANSIENT_STATUS_CODES = new Set([500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeTasks(rawTasks: unknown): ExtractedTask[] {
  if (!Array.isArray(rawTasks)) return [];

  return rawTasks
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item, index) => {
      const rawPriority = String(item.priority || "medium").toLowerCase() as TaskPriority;
      const priority: TaskPriority = VALID_PRIORITIES.includes(rawPriority)
        ? rawPriority
        : "medium";

      const rawMinutes = Number(item.estimated_minutes);
      const estimated_minutes =
        Number.isFinite(rawMinutes) && rawMinutes >= 5 ? Math.round(rawMinutes) : 25;

      return {
        id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : `task-${index + 1}`,
        title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : "Tugas Tanpa Judul",
        category: typeof item.category === "string" && item.category.trim() ? item.category.trim() : "Umum",
        estimated_minutes,
        priority,
        priority_reason:
          typeof item.priority_reason === "string" && item.priority_reason.trim()
            ? item.priority_reason.trim()
            : "Perlu segera diselesaikan agar beban tugas berkurang.",
        micro_step:
          typeof item.micro_step === "string" && item.micro_step.trim()
            ? item.micro_step.trim()
            : "Buka materi terkait dan kerjakan bagian awal selama 5 menit.",
      };
    });
}

async function requestGeminiModel(params: {
  baseUrl: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
  inputText: string;
}): Promise<string> {
  const { baseUrl, model, apiKey, timeoutMs, inputText } = params;
  const cleanModel = model.replace(/^models\//, "");
  const endpoint = `${baseUrl}/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;
  const maxAttempts = 2;
  let lastErrorMessage = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: BRAIN_DUMP_SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: buildBrainDumpUserPrompt(inputText) }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      });
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "TimeoutError";
      lastErrorMessage = isTimeout
        ? `Permintaan ke model ${cleanModel} melebihi batas waktu (${timeoutMs}ms).`
        : `Koneksi ke Gemini API gagal pada ${cleanModel}: ${err instanceof Error ? err.message : String(err)}`;

      if (attempt < maxAttempts) {
        await sleep(1000);
        continue;
      }
      throw new Error(lastErrorMessage);
    }

    if (response.ok) {
      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJsonText) {
        throw new Error(`Respons dari model ${cleanModel} kosong.`);
      }
      return rawJsonText;
    }

    if (response.status === 429) {
      throw new Error(
        "Batas permintaan AI per menit (Free Tier) tercapai. Silakan tunggu sekitar 30–60 detik lalu coba lagi."
      );
    }

    const errorDetail = await response.text();
    lastErrorMessage = `Gagal memanggil Gemini API (${response.status}) pada ${cleanModel}: ${errorDetail}`;

    if (TRANSIENT_STATUS_CODES.has(response.status) && attempt < maxAttempts) {
      await sleep(1500);
      continue;
    }

    throw new Error(lastErrorMessage);
  }

  throw new Error(lastErrorMessage);
}

export async function extractTasksFromBrainDump(
  inputText: string
): Promise<BrainDumpResponse> {
  if (!inputText || inputText.trim().length === 0) {
    return {
      summary: "Belum ada teks tugas yang dimasukkan.",
      tasks: [],
    };
  }

  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (provider === "mock") {
    return MOCK_BRAIN_DUMP_RESPONSE;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum diatur di environment variables.");
  }

  const baseUrl = (process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash";
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 15000;

  const candidateModels = Array.from(new Set([primaryModel, fallbackModel].filter(Boolean)));
  let rawJsonText: string | null = null;
  let primaryError: unknown = null;

  for (let i = 0; i < candidateModels.length; i++) {
    try {
      rawJsonText = await requestGeminiModel({
        baseUrl,
        model: candidateModels[i],
        apiKey,
        timeoutMs,
        inputText,
      });
      break;
    } catch (error) {
      if (i === 0) {
        primaryError = error;
      }
    }
  }

  if (!rawJsonText) {
    throw primaryError instanceof Error
      ? primaryError
      : new Error("Server AI sedang sibuk. Silakan coba beberapa saat lagi.");
  }

  const cleanedJson = rawJsonText
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleanedJson) as {
    summary?: unknown;
    tasks?: unknown;
  };

  const tasks = sanitizeTasks(parsed.tasks);
  const summary =
    typeof parsed.summary === "string" && parsed.summary.trim()
      ? parsed.summary.trim()
      : `Ada ${tasks.length} tugas terdeteksi. Mulai dari langkah pertama selama 5 menit.`;

  return {
    summary,
    tasks,
  };
}