export type CalendarViewMode = "day" | "week" | "month";

function parseDateKey(dateKey: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateKey.split("-").map(Number);
  return { y, m, d };
}

export function addDays(dateKey: string, days: number): string {
  const { y, m, d } = parseDateKey(dateKey);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Adds calendar months (not a fixed day count, so e.g. Jan 31 -> Feb
 *  still lands in February). Always returns the 1st of the target
 *  month, which is all month navigation needs. */
export function addMonths(dateKey: string, months: number): string {
  const { y, m } = parseDateKey(dateKey);
  const date = new Date(Date.UTC(y, m - 1 + months, 1));
  return date.toISOString().slice(0, 10);
}

export function startOfWeek(dateKey: string): string {
  const { y, m, d } = parseDateKey(dateKey);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDays(dateKey, offset);
}

export function startOfMonth(dateKey: string): string {
  const { y, m } = parseDateKey(dateKey);
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

export function weekDays(dateKey: string): string[] {
  const monday = startOfWeek(dateKey);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** 42 days (6 full weeks) covering the month, starting the Monday
 *  on/before the 1st -- always enough cells regardless of the month's
 *  start weekday or length. */
export function daysInMonthGrid(dateKey: string): string[] {
  const gridStart = startOfWeek(startOfMonth(dateKey));
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

/** [start, end) calendar-date window a view needs data for. */
export function rangeForView(view: CalendarViewMode, dateKey: string): { start: string; end: string } {
  if (view === "day") return { start: dateKey, end: addDays(dateKey, 1) };
  if (view === "week") {
    const start = startOfWeek(dateKey);
    return { start, end: addDays(start, 7) };
  }
  const gridStart = startOfWeek(startOfMonth(dateKey));
  return { start: gridStart, end: addDays(gridStart, 42) };
}
