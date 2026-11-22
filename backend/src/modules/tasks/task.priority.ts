import type { PriorityLevel } from '@prisma/client';

export const PRIORITY_THRESHOLDS = {
  HIGH: 70,
  MEDIUM: 40,
} as const;

export function normalizePriorityScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function priorityLevelFromScore(score: number): PriorityLevel {
  const normalized = normalizePriorityScore(score);

  if (normalized >= PRIORITY_THRESHOLDS.HIGH) {
    return 'HIGH';
  }

  if (normalized >= PRIORITY_THRESHOLDS.MEDIUM) {
    return 'MEDIUM';
  }

  return 'LOW';
}
