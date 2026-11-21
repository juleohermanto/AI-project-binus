import { Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { AppError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { getDayRange, parseDeadline, parseFilterDate, resolveTimeZone } from '../../lib/time';
import { buildPaginationMeta } from '../../lib/validators/common';
import { taskInclude, toTaskDto, type TaskWithSteps } from './task.dto';
import { priorityLevelFromScore } from './task.priority';
import type {
  CreateTaskInput,
  ListTasksQuery,
  MicroStepInput,
  UpdateMicroStepInput,
  UpdateTaskInput,
} from './task.schema';

async function getOwnedTaskOrThrow(userId: string, taskId: string): Promise<TaskWithSteps> {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    include: taskInclude,
  });

  if (!task) {
    throw new AppError(404, 'TASK_NOT_FOUND', 'Tugas tidak ditemukan');
  }

  return task;
}

function getMicroStepOrThrow(task: TaskWithSteps, stepId: string) {
  const step = task.microSteps.find((item) => item.id === stepId);

  if (!step) {
    throw new AppError(404, 'MICRO_STEP_NOT_FOUND', 'Micro-step tidak ditemukan');
  }

  return step;
}

function buildTaskOrderBy(
  sort: ListTasksQuery['sort'],
  order: ListTasksQuery['order'],
): Prisma.TaskOrderByWithRelationInput[] {
  switch (sort) {
    case 'deadline':
      return [
        { deadline: { sort: order, nulls: 'last' } },
        { priorityScore: 'desc' },
        { createdAt: 'desc' },
      ];
    case 'estimatedMinutes':
      return [{ estimatedMinutes: order }, { createdAt: 'desc' }];
    case 'createdAt':
      return [{ createdAt: order }];
    case 'priority':
    default:
      return [
        { priorityScore: order },
        { deadline: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'desc' },
      ];
  }
}

function mapMicroStepCreateInput(steps: MicroStepInput[]) {
  return steps.map((step, index) => ({
    title: step.title,
    description: step.description ?? null,
    estimatedMinutes: step.estimatedMinutes,
    order: step.order ?? index,
  }));
}

export async function createTask(userId: string, input: CreateTaskInput) {
  const task = await prisma.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? null,
      estimatedMinutes: input.estimatedMinutes,
      priorityScore: input.priorityScore,
      priorityLevel: priorityLevelFromScore(input.priorityScore),
      priorityReason: input.priorityReason ?? null,
      deadline: parseDeadline(input.deadline, env.APP_TIMEZONE),
      microSteps:
        input.microSteps.length > 0
          ? { create: mapMicroStepCreateInput(input.microSteps) }
          : undefined,
    },
    include: taskInclude,
  });

  return toTaskDto(task);
}

export async function listTasks(userId: string, query: ListTasksQuery) {
  const timeZone = resolveTimeZone(query.timezone);
  const where: Prisma.TaskWhereInput = { userId };

  if (query.status && query.status !== 'ALL') {
    where.status = query.status;
  }

  if (query.priority) {
    where.priorityLevel = query.priority;
  }

  if (query.category) {
    where.category = { equals: query.category, mode: 'insensitive' };
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const andConditions: Prisma.TaskWhereInput[] = [];

  if (query.date) {
    const range = getDayRange(query.date, timeZone);

    andConditions.push({
      OR: [
        { deadline: { gte: range.start, lte: range.end } },
        { deadline: null, createdAt: { gte: range.start, lte: range.end } },
      ],
    });
  }

  const deadlineFrom = parseFilterDate(query.deadlineFrom, 'deadlineFrom', 'start');
  const deadlineTo = parseFilterDate(query.deadlineTo, 'deadlineTo', 'end');

  if (deadlineFrom || deadlineTo) {
    andConditions.push({
      deadline: {
        ...(deadlineFrom ? { gte: deadlineFrom } : {}),
        ...(deadlineTo ? { lte: deadlineTo } : {}),
      },
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: buildTaskOrderBy(query.sort, query.order),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks: tasks.map(toTaskDto),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getTask(userId: string, taskId: string) {
  const task = await getOwnedTaskOrThrow(userId, taskId);
  return toTaskDto(task);
}

export async function updateTask(userId: string, taskId: string, input: UpdateTaskInput) {
  const task = await getOwnedTaskOrThrow(userId, taskId);
  const data: Prisma.TaskUpdateInput = {};

  if (input.title !== undefined) {
    data.title = input.title;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  if (input.category !== undefined) {
    data.category = input.category;
  }

  if (input.estimatedMinutes !== undefined) {
    data.estimatedMinutes = input.estimatedMinutes;
  }

  if (input.priorityScore !== undefined) {
    data.priorityScore = input.priorityScore;
    data.priorityLevel = priorityLevelFromScore(input.priorityScore);
  }

  if (input.priorityReason !== undefined) {
    data.priorityReason = input.priorityReason;
  }

  if (input.deadline !== undefined) {
    data.deadline = parseDeadline(input.deadline, env.APP_TIMEZONE);
  }

  if (Object.keys(data).length === 0) {
    return toTaskDto(task);
  }

  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data,
    include: taskInclude,
  });

  return toTaskDto(updatedTask);
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const result = await prisma.task.deleteMany({
    where: { id: taskId, userId },
  });

  if (result.count === 0) {
    throw new AppError(404, 'TASK_NOT_FOUND', 'Tugas tidak ditemukan');
  }
}

export async function completeTask(userId: string, taskId: string) {
  const task = await getOwnedTaskOrThrow(userId, taskId);

  if (task.status === 'COMPLETED') {
    return toTaskDto(task);
  }

  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
    include: taskInclude,
  });

  return toTaskDto(updatedTask);
}

export async function reopenTask(userId: string, taskId: string) {
  const task = await getOwnedTaskOrThrow(userId, taskId);

  if (task.status !== 'COMPLETED') {
    return toTaskDto(task);
  }

  const hasCompletedSteps = task.microSteps.some((step) => step.isCompleted);

  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data: {
      status: hasCompletedSteps ? 'IN_PROGRESS' : 'PENDING',
      completedAt: null,
    },
    include: taskInclude,
  });

  return toTaskDto(updatedTask);
}

export async function addMicroStep(userId: string, taskId: string, input: MicroStepInput) {
  const task = await getOwnedTaskOrThrow(userId, taskId);
  const nextOrder = task.microSteps.reduce((max, step) => Math.max(max, step.order), -1) + 1;

  await prisma.microStep.create({
    data: {
      taskId: task.id,
      title: input.title,
      description: input.description ?? null,
      estimatedMinutes: input.estimatedMinutes,
      order: input.order ?? nextOrder,
    },
  });

  const updatedTask = await getOwnedTaskOrThrow(userId, task.id);
  return toTaskDto(updatedTask);
}

export async function updateMicroStep(
  userId: string,
  taskId: string,
  stepId: string,
  input: UpdateMicroStepInput,
) {
  const task = await getOwnedTaskOrThrow(userId, taskId);
  const step = getMicroStepOrThrow(task, stepId);
  const data: Prisma.MicroStepUpdateInput = {};

  if (input.title !== undefined) {
    data.title = input.title;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  if (input.estimatedMinutes !== undefined) {
    data.estimatedMinutes = input.estimatedMinutes;
  }

  if (input.order !== undefined) {
    data.order = input.order;
  }

  if (Object.keys(data).length === 0) {
    return toTaskDto(task);
  }

  await prisma.microStep.update({
    where: { id: step.id },
    data,
  });

  const updatedTask = await getOwnedTaskOrThrow(userId, task.id);
  return toTaskDto(updatedTask);
}

export async function deleteMicroStep(userId: string, taskId: string, stepId: string) {
  const task = await getOwnedTaskOrThrow(userId, taskId);
  const step = getMicroStepOrThrow(task, stepId);

  await prisma.microStep.delete({ where: { id: step.id } });

  const updatedTask = await getOwnedTaskOrThrow(userId, task.id);
  return toTaskDto(updatedTask);
}

export async function setMicroStepCompletion(
  userId: string,
  taskId: string,
  stepId: string,
  isCompleted: boolean,
) {
  const task = await getOwnedTaskOrThrow(userId, taskId);
  const step = getMicroStepOrThrow(task, stepId);

  if (step.isCompleted === isCompleted) {
    return toTaskDto(task);
  }

  const now = new Date();

  await prisma.$transaction(async (transaction) => {
    await transaction.microStep.update({
      where: { id: step.id },
      data: {
        isCompleted,
        completedAt: isCompleted ? now : null,
      },
    });

    if (isCompleted && task.status === 'PENDING') {
      await transaction.task.update({
        where: { id: task.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    if (!isCompleted && task.status === 'COMPLETED') {
      await transaction.task.update({
        where: { id: task.id },
        data: { status: 'IN_PROGRESS', completedAt: null },
      });
    }
  });

  const updatedTask = await getOwnedTaskOrThrow(userId, task.id);
  return toTaskDto(updatedTask);
}
