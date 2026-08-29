import { createClient } from "@/lib/supabase/server";
import { dayKeyInZone, zonedWallTimeToUtc } from "@/lib/timezone";
import type { DayHours } from "@/lib/working-hours";
import type { Json } from "@/types/database.types";

const SLOT_INTERVAL_MINUTES = 30;

export interface AvailabilityParams {
  merchantId: string;
  date: string; // "YYYY-MM-DD", interpreted in `timezone`
  timezone: string;
  durationMinutes: number;
  workingHours: Json;
}

/**
 * Real availability, not a placeholder grid: generates candidate slots
 * across the merchant's open hours for that day, then drops any slot
 * that would overlap an existing pending/confirmed booking (mirroring
 * the same overlap rule the `bookings_no_overlap` EXCLUDE constraint
 * enforces in the database) or that has already passed.
 */
export async function getAvailableSlots({
  merchantId,
  date,
  timezone,
  durationMinutes,
  workingHours,
}: AvailabilityParams): Promise<Date[]> {
  const dayKey = dayKeyInZone(date, timezone);
  const hours = (workingHours as Record<string, DayHours> | null)?.[dayKey];

  if (!hours?.is_open || !hours.open || !hours.close) {
    return [];
  }

  const dayStart = zonedWallTimeToUtc(date, hours.open, timezone);
  const dayEnd = zonedWallTimeToUtc(date, hours.close, timezone);

  const supabase = await createClient();
  const { data: existing, error } = await supabase
    .from("bookings")
    .select("start_time, end_time")
    .eq("merchant_id", merchantId)
    .in("status", ["pending", "confirmed"])
    .lt("start_time", dayEnd.toISOString())
    .gt("end_time", dayStart.toISOString());

  if (error) throw error;

  const busy = (existing ?? []).map((b) => ({
    start: new Date(b.start_time).getTime(),
    end: new Date(b.end_time).getTime(),
  }));

  // Breaks (e.g. lunch) block the same way an existing booking does --
  // a candidate slot overlapping any part of a break is not offered.
  for (const brk of hours.breaks ?? []) {
    if (!brk.start || !brk.end) continue;
    busy.push({
      start: zonedWallTimeToUtc(date, brk.start, timezone).getTime(),
      end: zonedWallTimeToUtc(date, brk.end, timezone).getTime(),
    });
  }

  const now = Date.now();
  const durationMs = durationMinutes * 60_000;
  const slots: Date[] = [];

  for (
    let cursor = dayStart.getTime();
    cursor + durationMs <= dayEnd.getTime();
    cursor += SLOT_INTERVAL_MINUTES * 60_000
  ) {
    const slotEnd = cursor + durationMs;
    const overlapsExisting = busy.some((b) => cursor < b.end && slotEnd > b.start);
    const isPast = cursor < now;

    if (!overlapsExisting && !isPast) {
      slots.push(new Date(cursor));
    }
  }

  return slots;
}
