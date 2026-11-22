import { Prisma, type FocusSessionStatus } from '@prisma/client';

export const focusSessionInclude = {
  task: {
    select: { id: true, title: true },
  },
  microStep: {
    select: {
      id: true,
      title: true,
      estimatedMinutes: true,
      isCompleted: true,
      order: true,
    },
  },
} satisfies Prisma.FocusSessionInclude;

export type FocusSessionWithRelations = Prisma.FocusSessionGetPayload<{
  include: typeof focusSessionInclude;
}>;

export interface FocusSessionDto {
  id: string;
  durationMinutes: number;
  status: FocusSessionStatus;
  motivationalMessage: string | null;
  startedAt: string;
  endsAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  task: {
    id: string;
    title: string;
  };
  microStep: {
    id: string;
    title: string;
    estimatedMinutes: number;
    isCompleted: boolean;
    order: number;
  } | null;
}

export function toFocusSessionDto(session: FocusSessionWithRelations): FocusSessionDto {
  const endsAt = new Date(session.startedAt.getTime() + session.durationMinutes * 60_000);

  return {
    id: session.id,
    durationMinutes: session.durationMinutes,
    status: session.status,
    motivationalMessage: session.motivationalMessage,
    startedAt: session.startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    task: session.task,
    microStep: session.microStep,
  };
}
