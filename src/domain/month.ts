/**
 * Budget months are identified by a "YYYY-MM" key. Keeping them as strings
 * makes them trivially serialisable and sortable, and matches a Postgres
 * `date` column truncated to the first of the month.
 */

export type MonthKey = `${number}-${string}`;

const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isMonthKey(value: string): value is MonthKey {
  return MONTH_KEY_PATTERN.test(value);
}

export function parseMonthKey(value: string): MonthKey {
  if (!isMonthKey(value)) throw new RangeError(`Invalid month key: ${value}`);
  return value;
}

function parts(month: MonthKey): { year: number; monthIndex: number } {
  const [year, mm] = month.split('-');
  return { year: Number(year), monthIndex: Number(mm) - 1 };
}

export function monthLabel(month: MonthKey, style: 'long' | 'short' = 'long'): string {
  const { year, monthIndex } = parts(month);
  return new Intl.DateTimeFormat('en-GB', {
    month: style,
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

export function monthName(month: MonthKey): string {
  const { year, monthIndex } = parts(month);
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

/** ISO date (YYYY-MM-DD) for a given day within the month, clamped to the month's length. */
export function dateInMonth(month: MonthKey, day: number): string {
  const { year, monthIndex } = parts(month);
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const clamped = Math.min(Math.max(1, Math.trunc(day)), lastDay);
  return `${month}-${String(clamped).padStart(2, '0')}`;
}

export function isDateInMonth(isoDate: string, month: MonthKey): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(isoDate) && isoDate.startsWith(`${month}-`);
}

export function formatDay(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)));
}
