import { createClient } from "@/lib/supabase/server";
import { getStaffForService } from "@/lib/data/staff";
import { dateKeyInZone, dayKeyInZone, zonedWallTimeToUtc } from "@/lib/timezone";
import type { DayHours } from "@/lib/working-hours";
import type { Json } from "@/types/database.types";

const SLOT_INTERVAL_MINUTES = 30;

/**
 * Point-in-time twin of getAvailableSlots' own window/break logic, used
 * to re-check a specific [startTime, endTime) at booking-creation time.
 * getAvailableSlots only ever shapes what the UI *offers*; nothing
 * server-side previously stopped a request built outside that flow
 * (devtools, a stale client, a future bug) from booking a slot the
 * merchant is actually closed for -- the bookings_no_overlap EXCLUDE
 * constraint catches double-bookings, never this.
 */
export function isWithinWorkingHours(
  startTime: Date,
  endTime: Date,
  workingHours: Json,
  timezone: string,
): boolean {
  const dateStr = dateKeyInZone(startTime, timezone);
  const dayKey = dayKeyInZone(dateStr, timezone);
  const hours = (workingHours as Record<string, DayHours> | null)?.[dayKey];

  if (!hours?.is_open || !hours.open || !hours.close) {
    return false;
  }

  const dayStart = zonedWallTimeToUtc(dateStr, hours.open, timezone);
  const dayEnd = zonedWallTimeToUtc(dateStr, hours.close, timezone);

  if (startTime.getTime() < dayStart.getTime() || endTime.getTime() > dayEnd.getTime()) {
    return false;
  }

  for (const brk of hours.breaks ?? []) {
    if (!brk.start || !brk.end) continue;
    const breakStart = zonedWallTimeToUtc(dateStr, brk.start, timezone).getTime();
    const breakEnd = zonedWallTimeToUtc(dateStr, brk.end, timezone).getTime();
    if (startTime.getTime() < breakEnd && endTime.getTime() > breakStart) {
      return false;
    }
  }

  return true;
}

export interface AvailabilityParams {
  merchantId: string;
  date: string; // "YYYY-MM-DD", interpreted in `timezone`
  timezone: string;
  durationMinutes: number;
  workingHours: Json;
  /** A specific staff member's id -- when set, busy times come from
   *  *their* bookings only, not every booking at the merchant. Omitted
   *  entirely, this is the original merchant-as-one-resource behavior:
   *  every call site that predates staff members (and every merchant
   *  that never adopts them) keeps working exactly as before. */
  staffId?: string;
}

/**
 * Real availability, not a placeholder grid: generates candidate slots
 * across the open hours for that day (the merchant's, or a specific
 * staff member's own -- whichever `workingHours` the caller passes),
 * then drops any slot that would overlap an existing pending/confirmed
 * booking for that same resource (mirroring the same overlap rule the
 * `bookings_no_overlap` EXCLUDE constraint enforces in the database,
 * which likewise keys on staff_id when set and merchant_id otherwise)
 * or that has already passed.
 */
export async function getAvailableSlots({
  merchantId,
  date,
  timezone,
  durationMinutes,
  workingHours,
  staffId,
}: AvailabilityParams): Promise<Date[]> {
  const dayKey = dayKeyInZone(date, timezone);
  const hours = (workingHours as Record<string, DayHours> | null)?.[dayKey];

  if (!hours?.is_open || !hours.open || !hours.close) {
    return [];
  }

  const dayStart = zonedWallTimeToUtc(date, hours.open, timezone);
  const dayEnd = zonedWallTimeToUtc(date, hours.close, timezone);

  const supabase = await createClient();
  let busyQuery = supabase
    .from("bookings")
    .select("start_time, end_time")
    .in("status", ["pending", "confirmed"])
    .lt("start_time", dayEnd.toISOString())
    .gt("end_time", dayStart.toISOString());
  busyQuery = staffId ? busyQuery.eq("staff_id", staffId) : busyQuery.eq("merchant_id", merchantId);

  const { data: existing, error } = await busyQuery;

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

export interface AnyStaffAvailabilityParams {
  merchantId: string;
  serviceId: string;
  date: string;
  timezone: string;
  durationMinutes: number;
  /** The merchant's own working_hours -- used only as the fallback
   *  path below, when no staff is assigned to this service at all. */
  workingHours: Json;
}

/**
 * "Orice specialist disponibil": the union of every qualified, active
 * staff member's own availability -- a slot counts as available the
 * moment at least one of them is free for it. A service nobody is
 * assigned to (the common case for a merchant that hasn't adopted
 * staff at all) falls back to plain merchant-level getAvailableSlots,
 * unchanged from before staff members existed.
 */
export async function getAvailableSlotsAnyStaff({
  merchantId,
  serviceId,
  date,
  timezone,
  durationMinutes,
  workingHours,
}: AnyStaffAvailabilityParams): Promise<Date[]> {
  const staff = await getStaffForService(merchantId, serviceId);

  if (staff.length === 0) {
    return getAvailableSlots({ merchantId, date, timezone, durationMinutes, workingHours });
  }

  const perStaffSlots = await Promise.all(
    staff.map((member) =>
      getAvailableSlots({
        merchantId,
        date,
        timezone,
        durationMinutes,
        workingHours: member.working_hours,
        staffId: member.id,
      }),
    ),
  );

  const union = new Map<number, Date>();
  for (const slots of perStaffSlots) {
    for (const slot of slots) union.set(slot.getTime(), slot);
  }

  return Array.from(union.values()).sort((a, b) => a.getTime() - b.getTime());
}
