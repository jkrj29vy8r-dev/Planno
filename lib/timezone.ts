/**
 * Minimal IANA timezone conversion without an extra dependency, used to
 * turn a merchant's local working hours (e.g. "10:00" in
 * "Europe/Bucharest") into a correct UTC instant for a given date --
 * DST-correct because the offset is recomputed for that specific date.
 */
function offsetForZoneAt(timeZone: string, atUtc: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(atUtc).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - atUtc.getTime();
}

/** dateStr: "YYYY-MM-DD", timeStr: "HH:mm". Returns the UTC instant that
 *  reads as dateStr/timeStr wall-clock time in `timeZone`. */
export function zonedWallTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const guess = new Date(`${dateStr}T${timeStr}:00Z`);
  const offset = offsetForZoneAt(timeZone, guess);
  return new Date(guess.getTime() - offset);
}

/** The day-of-week key (as used in merchants.working_hours) for a
 *  "YYYY-MM-DD" date, evaluated in `timeZone` rather than the server's. */
export function dayKeyInZone(dateStr: string, timeZone: string): string {
  const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const noonUtc = zonedWallTimeToUtc(dateStr, "12:00", timeZone);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).format(noonUtc);
  return dayKeys.find((key) => key === weekday.toLowerCase()) ?? dayKeys[noonUtc.getUTCDay()];
}

/** Formats a UTC instant as a wall-clock "HH:mm" string in `timeZone`. */
export function formatTimeInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("ro-RO", { timeZone, hour: "2-digit", minute: "2-digit" }).format(
    date,
  );
}

/** Today's date as "YYYY-MM-DD" in `timeZone` (not the server's local date). */
export function todayInZone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}
