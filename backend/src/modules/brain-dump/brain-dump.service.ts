import { getAiProvider } from '../../ai';
import { extractJsonObject, truncate } from '../../ai/json';
import {
  buildBrainDumpRepairPrompt,
  buildBrainDumpSystemPrompt,
  buildBrainDumpUserPrompt,
} from '../../ai/prompts/brain-dump.prompt';
import {
  aiBrainDumpSchema,
  normalizeAiBrainDumpPayload,
  type AiBrainDumpResult,
  type AiTask,
} from '../../ai/schemas/brain-dump.schema';
import { AppError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { parseDeadline, resolveTimeZone } from '../../lib/time';
import { taskInclude, toTaskDto } from '../tasks/task.dto';
import { priorityLevelFromScore } from '../tasks/task.priority';
import type { BrainDumpInput } from './brain-dump.schema';

interface ParsedAiResponse {
  success: true;
  data: AiBrainDumpResult;
}

interface InvalidAiResponse {
  success: false;
  issues: string[];
}

function parseAndValidate(rawResponse: string): ParsedAiResponse | InvalidAiResponse {
  try {
    const parsed = extractJsonObject(rawResponse);
    const normalized = normalizeAiBrainDumpPayload(parsed);
    const result = aiBrainDumpSchema.safeParse(normalized);

    if (!result.success) {
      return {
        success: false,
        issues: result.error.issues.map(
          (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
        ),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      issues: [error instanceof Error ? error.message : 'Respons AI tidak valid'],
    };
  }
}

function buildMicroStepCreates(task: AiTask) {
  return [task.firstMicroStep, ...task.additionalSteps].map((step, index) => ({
    title: step.title,
    estimatedMinutes: step.estimatedMinutes,
    order: index,
  }));
}

export async function processBrainDump(userId: string, input: BrainDumpInput) {
  const timeZone = resolveTimeZone(input.timezone);
  const provider = getAiProvider();
  const systemPrompt = buildBrainDumpSystemPrompt();
  const userPrompt = buildBrainDumpUserPrompt(input.text, timeZone);

  const firstRawResponse = await provider.generate({
    systemPrompt,
    userPrompt,
    rawInput: input.text,
  });

  let attempts = 1;
  let parsedResponse = parseAndValidate(firstRawResponse);

  if (!parsedResponse.success) {
    attempts = 2;

    const repairPrompt = buildBrainDumpRepairPrompt({
      rawText: input.text,
      previousResponse: firstRawResponse,
      issues: parsedResponse.issues,
      timeZone,
    });

    const repairRawResponse = await provider.generate({
      systemPrompt,
      userPrompt: repairPrompt,
      rawInput: input.text,
    });

    parsedResponse = parseAndValidate(repairRawResponse);

    if (!parsedResponse.success) {
      throw new AppError(
        502,
        'AI_INVALID_RESPONSE',
        'AI tidak mengembalikan format tugas yang valid setelah percobaan perbaikan',
        {
          issues: parsedResponse.issues,
          rawPreview: truncate(repairRawResponse, 1000),
        },
      );
    }
  }

  const aiTasks = parsedResponse.data.tasks;

  const creates = aiTasks.map((task) =>
    prisma.task.create({
      data: {
        userId,
        title: task.title,
        description: task.description || null,
        category: task.category || 'Lainnya',
        estimatedMinutes: task.estimatedMinutes,
        priorityScore: task.priorityScore,
        priorityLevel: priorityLevelFromScore(task.priorityScore),
        priorityReason: task.priorityReason || null,
        deadline: parseDeadline(task.deadline, timeZone),
        source: 'BRAIN_DUMP',
        microSteps: {
          create: buildMicroStepCreates(task),
        },
      },
      include: taskInclude,
    }),
  );

  const createdTasks = await prisma.$transaction(creates);

  return {
    tasks: createdTasks.map(toTaskDto),
    meta: {
      provider: provider.name,
      model: provider.model,
      taskCount: createdTasks.length,
      timezone: timeZone,
      attempts,
      generatedAt: new Date().toISOString(),
    },
  };
}
