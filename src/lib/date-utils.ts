import {
  differenceInWeeks,
  differenceInMonths,
  differenceInDays,
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subWeeks,
  addDays,
  parseISO,
  isAfter,
  isBefore,
  isSameDay,
} from "date-fns";

/**
 * Number of complete weeks since birthdate.
 */
function getAgeInWeeks(birthdate: Date, referenceDate = new Date()): number {
  return differenceInWeeks(referenceDate, birthdate);
}

/**
 * Number of complete months since birthdate.
 */
export function getAgeInMonths(birthdate: Date, referenceDate = new Date()): number {
  return differenceInMonths(referenceDate, birthdate);
}

/**
 * Human-readable age label: "3 weeks old", "5 months old", "1 year 2 months old".
 */
export function getAgeLabel(birthdate: Date, referenceDate = new Date()): string {
  const weeks = getAgeInWeeks(birthdate, referenceDate);
  const months = getAgeInMonths(birthdate, referenceDate);

  if (weeks < 4) {
    return `${weeks} week${weeks !== 1 ? "s" : ""} old`;
  }
  if (months < 24) {
    return `${months} month${months !== 1 ? "s" : ""} old`;
  }
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (remMonths === 0) {
    return `${years} year${years !== 1 ? "s" : ""} old`;
  }
  return `${years}y ${remMonths}m old`;
}

/**
 * "Day 1", "Day 42" etc. — 1-indexed days since birth.
 */
export function getDayNumber(birthdate: Date, date: Date): number {
  return differenceInDays(date, birthdate) + 1;
}

/**
 * Format a date string "YYYY-MM-DD" as a pretty display string.
 * e.g. "March 15, 2024"
 */
export function formatMemoryDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMMM d, yyyy");
}

/**
 * Short date for cards: "Mar 15"
 */
export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d");
}

/**
 * Get the month index (0 = birth month) for a given date relative to birthdate.
 */
function getMonthIndex(birthdate: Date, date: Date): number {
  return differenceInMonths(date, birthdate);
}

/**
 * Get the start and end dates for a specific month index relative to birthdate.
 * Month 0 = the calendar month containing birthdate.
 */
function getMonthRange(birthdate: Date, monthIndex: number): { start: Date; end: Date } {
  const referenceMonth = addMonths(birthdate, monthIndex);
  return {
    start: startOfMonth(referenceMonth),
    end: endOfMonth(referenceMonth),
  };
}

/**
 * Total number of months from birth to today (inclusive).
 */
export function getTotalMonths(birthdate: Date): number {
  return getAgeInMonths(birthdate) + 1; // +1 to include current month
}

/**
 * Label for a month pill: "Birth" for month 0, "Month N" otherwise.
 */
export function getMonthPillLabel(monthIndex: number): string {
  return monthIndex === 0 ? "Birth" : `Month ${monthIndex}`;
}

/**
 * Date range string for a month pill: "Jan 15 – Feb 14"
 */
export function getMonthPillDateRange(birthdate: Date, monthIndex: number): string {
  const { start, end } = getMonthRange(birthdate, monthIndex);
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}

/**
 * Whether a given date string (YYYY-MM-DD) falls within a specific month index.
 */
export function isDateInMonth(dateStr: string, birthdate: Date, monthIndex: number): boolean {
  const date = parseISO(dateStr);
  const { start, end } = getMonthRange(birthdate, monthIndex);
  return !isBefore(date, start) && !isAfter(date, end);
}

/**
 * Generate data for the 36-week activity heatmap.
 * Returns array of { start, end, hasActivity } for each week.
 */
export function getHeatmapWeeks(
  steps: Array<{ date: string }>,
  referenceDate = new Date()
): Array<{ start: Date; end: Date; hasActivity: boolean }> {
  return Array.from({ length: 36 }, (_, i) => {
    const start = subWeeks(referenceDate, 35 - i);
    const end = addDays(start, 6);
    const hasActivity = steps.some((s) => {
      const d = parseISO(s.date);
      return !isBefore(d, start) && !isAfter(d, end);
    });
    return { start, end, hasActivity };
  });
}

/**
 * Parse today's date as "YYYY-MM-DD" string.
 */
export function todayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Check if two "YYYY-MM-DD" strings represent the same day.
 */
function isSameDateString(a: string, b: string): boolean {
  return isSameDay(parseISO(a), parseISO(b));
}
