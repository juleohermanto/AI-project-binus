import { TaskStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { formatDuration, getDayRange, resolveTimeZone } from '../../lib/time';
import { taskInclude, toTaskDto, type TaskWithSteps } from '../tasks/task.dto';
import { getBotanicalGrowth } from './botanical';
import type { OverviewQuery } from './overview.schema';

const ACTIVE_STATUSES = [TaskStatus.PENDING, TaskStatus.IN_PROGRESS];

function compareRecommendedTasks(a: TaskWithSteps, b: TaskWithSteps): number {
  if (a.priorityScore !== b.priorityScore) {
    return b.priorityScore - a.priorityScore;
  }

  const aDeadline = a.deadline?.getTime() ?? Number.POSITIVE_INFINITY;
  const bDeadline = b.deadline?.getTime() ?? Number.POSITIVE_INFINITY;

  if (aDeadline !== bDeadline) {
    return aDeadline - bDeadline;
  }

  return a.createdAt.getTime() - b.createdAt.getTime();
}

export async function getDailyOverview(userId: string, query: OverviewQuery) {
  const timeZone = resolveTimeZone(query.timezone);
  const range = getDayRange(query.date, timeZone);
  const now = new Date();

  const [
    activeTasks,
    completedToday,
    activeWorkload,
    completedWorkload,
    overdueTasks,
    candidates,
  ] = await prisma.$transaction([
    prisma.task.count({
      where: { userId, status: { in: ACTIVE_STATUSES } },
    }),
    prisma.task.count({
      where: {
        userId,
        status: TaskStatus.COMPLETED,
        completedAt: { gte: range.start, lte: range.end },
      },
    }),
    prisma.task.aggregate({
      where: { userId, status: { in: ACTIVE_STATUSES } },
      _sum: { estimatedMinutes: true },
    }),
    prisma.task.aggregate({
      where: {
        userId,
        status: TaskStatus.COMPLETED,
        completedAt: { gte: range.start, lte: range.end },
      },
      _sum: { estimatedMinutes: true },
    }),
    prisma.task.count({
      where: {
        userId,
        status: { in: ACTIVE_STATUSES },
        deadline: { lt: now },
      },
    }),
    prisma.task.findMany({
      where: { userId, status: { in: ACTIVE_STATUSES } },
      include: taskInclude,
      orderBy: [{ priorityScore: 'desc' }, { createdAt: 'asc' }],
      take: 100,
    }),
  ]);

  const totalTasksToday = activeTasks + completedToday;
  const completionPercentage =
    totalTasksToday === 0 ? 0 : Math.round((completedToday / totalTasksToday) * 100);

  const activeMinutes = activeWorkload._sum.estimatedMinutes ?? 0;
  const completedMinutes = completedWorkload._sum.estimatedMinutes ?? 0;
  const totalMinutes = activeMinutes + completedMinutes;

  const recommendedTask = [...candidates].sort(compareRecommendedTasks)[0] ?? null;

  return {
    date: range.date,
    timezone: timeZone,
    tasks: {
      active: activeTasks,
      completedToday,
      overdue: overdueTasks,
      totalToday: totalTasksToday,
    },
    workload: {
      totalMinutes,
      activeMinutes,
      completedMinutes,
      remainingMinutes: activeMinutes,
      totalLabel: formatDuration(totalMinutes),
      activeLabel: formatDuration(activeMinutes),
      completedLabel: formatDuration(completedMinutes),
      remainingLabel: formatDuration(activeMinutes),
    },
    completionPercentage,
    recommendedTask: recommendedTask ? toTaskDto(recommendedTask) : null,
    botanical: getBotanicalGrowth(completionPercentage),
  };
}
