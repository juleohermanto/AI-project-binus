import { DateTime, IANAZone } from 'luxon';
import { env } from '../config/env';
import { AppError } from './errors';

export interface DayRange {
  date: string;
  start: Date;
  end: Date;
}

export function isValidTimeZone(timeZone: string): boolean {
  return IANAZone.isValidZone(timeZone);
}

export function resolveTimeZone(timeZone?: string | null): string {
  const resolved = timeZone?.trim() || env.APP_TIMEZONE;

  if (!isValidTimeZone(resolved)) {
    throw new AppError(400, 'INVALID_TIMEZONE', `Timezone "${resolved}" tidak valid`);
  }

  return resolved;
}

export function getDayRange(date: string | undefined, timeZone: string): DayRange {
  let base: DateTime;

  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError(400, 'INVALID_DATE', 'Format tanggal harus YYYY-MM-DD');
    }

    base = DateTime.fromFormat(date, 'yyyy-MM-dd', { zone: timeZone });
  } else {
    base = DateTime.now().setZone(timeZone);
  }

  if (!base.isValid) {
    throw new AppError(400, 'INVALID_DATE', `Tanggal "${date}" tidak valid`);
  }

  const startOfDay = base.startOf('day');

  return {
    date: startOfDay.toISODate() ?? date ?? '',
    start: startOfDay.toUTC().toJSDate(),
    end: startOfDay.endOf('day').toUTC().toJSDate(),
  };
}

export function parseDeadline(value: string | null | undefined, timeZone: string): Date | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null;
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = DateTime.fromISO(value, { zone: timeZone, setZone: true });

  if (!parsed.isValid) {
    throw new AppError(422, 'INVALID_DEADLINE', `Deadline "${value}" tidak valid`);
  }

  return (isDateOnly ? parsed.endOf('day') : parsed).toUTC().toJSDate();
}

export function parseFilterDate(
  value: string | null | undefined,
  fieldName: string,
  boundary: 'start' | 'end' = 'start',
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = DateTime.fromISO(
    value,
    isDateOnly ? { zone: env.APP_TIMEZONE } : { setZone: true },
  );

  if (!parsed.isValid) {
    throw new AppError(422, 'INVALID_DATE_FILTER', `${fieldName} harus berupa tanggal ISO 8601 yang valid`);
  }

  const normalized = isDateOnly && boundary === 'end' ? parsed.endOf('day') : parsed;

  return normalized.toUTC().toJSDate();
}

export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours > 0 && remainder > 0) {
    return `${hours} jam ${remainder} menit`;
  }

  if (hours > 0) {
    return `${hours} jam`;
  }

  return `${remainder} menit`;
}

export function describeCurrentDateTime(timeZone: string): string {
  const now = DateTime.now().setZone(timeZone).setLocale('id');

  return `Sekarang: ${now.toFormat('cccc, dd LLLL yyyy, HH:mm')} (${timeZone}); tanggal ISO: ${now.toISODate()}`;
}
