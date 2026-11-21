import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { parseFilterDate } from '../../lib/time';
import { buildPaginationMeta } from '../../lib/validators/common';
import {
  focusSessionInclude,
  toFocusSessionDto,
  type FocusSessionWithRelations,
} from './focus-session.dto';
import type {
  CompleteFocusSessionInput,
  CreateFocusSessionInput,
  ListFocusSessionsQuery,
} from './focus-session.schema';

const MOTIVATIONAL_MESSAGES = [
  'Satu langkah kecil hari ini lebih baik daripada rencana besar yang terus ditunda.',
  'Kamu tidak harus menyelesaikan semuanya sekarang. Cukup langkah ini.',
  'Fokus beberapa menit saja. Sisanya akan terasa lebih ringan.',
  'Tarik napas, lalu mulai dari bagian paling kecil.',
  'Tanaman tumbuh pelan, tetapi tetap tumbuh. Kamu juga.',
  'Jangan menunggu semangat datang; mulailah, semangat akan menyusul.',
  'Kemajuan kecil tetap kemajuan. Beri dirimu kesempatan untuk mulai.',
  'Kerjakan versi paling sederhana dulu. Kamu bisa memperbaikinya nanti.',
  'Langkah pertama tidak perlu sempurna, hanya perlu dimulai.',
  'Kamu sudah sampai sejauh ini. Selesaikan satu potongan kecil lagi.',
];

function pickMotivationalMessage(): string {
  return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
}

async function getOwnedSessionOrThrow(
  userId: string,
  sessionId: string,
): Promise<FocusSessionWithRelations> {
  const session = await prisma.focusSession.findFirst({
    where: { id: sessionId, userId },
    include: focusSessionInclude,
  });

  if (!session) {
    throw new AppError(404, 'FOCUS_SESSION_NOT_FOUND', 'Sesi fokus tidak ditemukan');
  }

  return session;
}

export async function startFocusSession(userId: string, input: CreateFocusSessionInput) {
  const task = await prisma.task.findFirst({
    where: { id: input.taskId, userId },
    include: {
      microSteps: { orderBy: { order: 'asc' } },
    },
  });

  if (!task) {
    throw new AppError(404, 'TASK_NOT_FOUND', 'Tugas tidak ditemukan');
  }

  if (task.status === 'COMPLETED') {
    throw new AppError(409, 'TASK_ALREADY_COMPLETED', 'Tugas ini sudah selesai');
  }

  const activeSession = await prisma.focusSession.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: focusSessionInclude,
    orderBy: { startedAt: 'desc' },
  });

  if (activeSession) {
    throw new AppError(
      409,
      'ACTIVE_FOCUS_SESSION_EXISTS',
      'Masih ada sesi fokus yang aktif. Selesaikan atau batalkan sesi tersebut terlebih dahulu.',
      { activeSession: toFocusSessionDto(activeSession) },
    );
  }

  let microStepId = input.microStepId ?? null;

  if (microStepId) {
    const microStep = task.microSteps.find((step) => step.id === microStepId);

    if (!microStep) {
      throw new AppError(404, 'MICRO_STEP_NOT_FOUND', 'Micro-step tidak ditemukan pada tugas ini');
    }

    if (microStep.isCompleted) {
      throw new AppError(409, 'MICRO_STEP_ALREADY_COMPLETED', 'Micro-step ini sudah selesai');
    }
  } else {
    microStepId = task.microSteps.find((step) => !step.isCompleted)?.id ?? null;
  }

  const [session] = await prisma.$transaction([
    prisma.focusSession.create({
      data: {
        userId,
        taskId: task.id,
        microStepId,
        durationMinutes: input.durationMinutes,
        motivationalMessage: pickMotivationalMessage(),
      },
      include: focusSessionInclude,
    }),
    prisma.task.updateMany({
      where: { id: task.id, status: 'PENDING' },
      data: { status: 'IN_PROGRESS' },
    }),
  ]);

  return toFocusSessionDto(session);
}

export async function listFocusSessions(userId: string, query: ListFocusSessionsQuery) {
  const where: Prisma.FocusSessionWhereInput = { userId };

  if (query.status && query.status !== 'ALL') {
    where.status = query.status;
  }

  const from = parseFilterDate(query.from, 'from', 'start');
  const to = parseFilterDate(query.to, 'to', 'end');

  if (from || to) {
    where.startedAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  const [sessions, total] = await prisma.$transaction([
    prisma.focusSession.findMany({
      where,
      include: focusSessionInclude,
      orderBy: { startedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.focusSession.count({ where }),
  ]);

  return {
    sessions: sessions.map(toFocusSessionDto),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getActiveFocusSession(userId: string) {
  const session = await prisma.focusSession.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: focusSessionInclude,
    orderBy: { startedAt: 'desc' },
  });

  return session ? toFocusSessionDto(session) : null;
}

export async function getFocusSession(userId: string, sessionId: string) {
  const session = await getOwnedSessionOrThrow(userId, sessionId);
  return toFocusSessionDto(session);
}

export async function completeFocusSession(
  userId: string,
  sessionId: string,
  input: CompleteFocusSessionInput,
) {
  const session = await getOwnedSessionOrThrow(userId, sessionId);

  if (session.status !== 'ACTIVE') {
    throw new AppError(
      409,
      'INVALID_FOCUS_SESSION_STATUS',
      `Sesi fokus berstatus ${session.status} tidak dapat diselesaikan`,
    );
  }

  const now = new Date();

  const updatedSession = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.focusSession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        endedAt: now,
      },
      include: focusSessionInclude,
    });

    if (input.completeMicroStep && session.microStepId) {
      await transaction.microStep.update({
        where: { id: session.microStepId },
        data: {
          isCompleted: true,
          completedAt: now,
        },
      });

      await transaction.task.updateMany({
        where: { id: session.taskId, status: 'PENDING' },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return updated;
  });

  return toFocusSessionDto(updatedSession);
}

export async function cancelFocusSession(userId: string, sessionId: string) {
  const session = await getOwnedSessionOrThrow(userId, sessionId);

  if (session.status !== 'ACTIVE') {
    throw new AppError(
      409,
      'INVALID_FOCUS_SESSION_STATUS',
      `Sesi fokus berstatus ${session.status} tidak dapat dibatalkan`,
    );
  }

  const updatedSession = await prisma.focusSession.update({
    where: { id: session.id },
    data: {
      status: 'CANCELLED',
      endedAt: new Date(),
    },
    include: focusSessionInclude,
  });

  return toFocusSessionDto(updatedSession);
}
