import { Prisma, type MicroStep, type PriorityLevel, type TaskSource, type TaskStatus } from '@prisma/client';

export const taskInclude = {
  microSteps: {
    orderBy: { order: 'asc' },
  },
} satisfies Prisma.TaskInclude;

export type TaskWithSteps = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export interface MicroStepDto {
  id: string;
  title: string;
  description: string | null;
  estimatedMinutes: number;
  order: number;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface TaskDto {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  estimatedMinutes: number;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  priorityReason: string | null;
  deadline: string | null;
  status: TaskStatus;
  source: TaskSource;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  microSteps: MicroStepDto[];
  firstMicroStep: MicroStepDto | null;
  nextMicroStep: MicroStepDto | null;
  progress: {
    completedSteps: number;
    totalSteps: number;
    percentage: number;
  };
}

export function toMicroStepDto(step: MicroStep): MicroStepDto {
  return {
    id: step.id,
    title: step.title,
    description: step.description,
    estimatedMinutes: step.estimatedMinutes,
    order: step.order,
    isCompleted: step.isCompleted,
    completedAt: step.completedAt?.toISOString() ?? null,
  };
}

export function toTaskDto(task: TaskWithSteps): TaskDto {
  const microSteps = task.microSteps.map(toMicroStepDto);
  const completedSteps = microSteps.filter((step) => step.isCompleted).length;
  const totalSteps = microSteps.length;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    category: task.category,
    estimatedMinutes: task.estimatedMinutes,
    priorityScore: task.priorityScore,
    priorityLevel: task.priorityLevel,
    priorityReason: task.priorityReason,
    deadline: task.deadline?.toISOString() ?? null,
    status: task.status,
    source: task.source,
    isCompleted: task.status === 'COMPLETED',
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    microSteps,
    firstMicroStep: microSteps[0] ?? null,
    nextMicroStep: microSteps.find((step) => !step.isCompleted) ?? null,
    progress: {
      completedSteps,
      totalSteps,
      percentage: totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100),
    },
  };
}
