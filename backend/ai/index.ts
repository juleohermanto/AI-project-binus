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

/**
 * Sprint 1: Mengembalikan data dummy sesuai kontrak JSON.
 * Sprint 2 (#7): Akan diganti dengan pemanggilan API LLM asli.
 */
export async function extractTasksFromBrainDump(
  inputText: string
): Promise<BrainDumpResponse> {
  if (!inputText || inputText.trim().length === 0) {
    return {
      summary: "Belum ada teks tugas yang dimasukkan.",
      tasks: [],
    };
  }

  return MOCK_BRAIN_DUMP_RESPONSE;
}