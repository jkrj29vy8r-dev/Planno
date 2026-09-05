import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";
import { addDays, addMonths, rangeForView, startOfMonth } from "@/lib/merchant-calendar";
import { todayInZone, zonedWallTimeToUtc } from "@/lib/timezone";

/** Cached per request: the layout and every dashboard page independently
 *  need the owned merchant, and this keeps that down to one query. */
export const getOwnedMerchant = cache(async (ownerId: string): Promise<Tables<"merchants"> | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
});

export type CalendarBooking = Tables<"bookings"> & {
  client: Pick<Tables<"profiles">, "id" | "full_name" | "email" | "phone">;
  service: Pick<Tables<"services">, "id" | "name" | "duration_minutes">;
};

const CALENDAR_SELECT =
  "*, client:profiles!bookings_client_id_fkey(id, full_name, email, phone), service:services(id, name, duration_minutes)";

/** All bookings overlapping [rangeStart, rangeEnd) -- the window a
 *  calendar view (day/week/month) currently has on screen. */
export async function getMerchantBookingsInRange(
  merchantId: string,
  rangeStart: string,
  rangeEnd: string,
): Promise<CalendarBooking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(CALENDAR_SELECT)
    .eq("merchant_id", merchantId)
    .lt("start_time", rangeEnd)
    .gt("end_time", rangeStart)
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as CalendarBooking[];
}

/** Every booking for this merchant, most recent first -- backs the
 *  simple bookings list's "Toate" filter (Azi/Mâine are derived from
 *  this same set client-side rather than issuing separate queries). */
export async function getAllMerchantBookings(merchantId: string): Promise<CalendarBooking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(CALENDAR_SELECT)
    .eq("merchant_id", merchantId)
    .order("start_time", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as CalendarBooking[];
}

export async function getMerchantServices(merchantId: string): Promise<Tables<"services">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export interface MerchantClientSummary {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  totalBookings: number;
  lastVisit: string | null;
  nextUpcoming: string | null;
}

type ClientRef = Pick<Tables<"profiles">, "id" | "full_name" | "email" | "phone">;

/**
 * Clients aren't a table of their own -- a merchant's client list is
 * derived from whoever has booked with them, aggregated here rather
 * than via a view so the numbers always match the bookings list.
 */
export async function getMerchantClients(merchantId: string): Promise<MerchantClientSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("start_time, status, client:profiles!bookings_client_id_fkey(id, full_name, email, phone)")
    .eq("merchant_id", merchantId);

  if (error) throw error;

  const now = Date.now();
  const byClient = new Map<string, MerchantClientSummary>();

  for (const row of data ?? []) {
    const client = row.client as unknown as ClientRef | null;
    if (!client) continue;

    const existing: MerchantClientSummary = byClient.get(client.id) ?? {
      id: client.id,
      fullName: client.full_name,
      email: client.email,
      phone: client.phone,
      totalBookings: 0,
      lastVisit: null,
      nextUpcoming: null,
    };

    existing.totalBookings += 1;
    const startTime = new Date(row.start_time).getTime();

    if (row.status === "completed" && (!existing.lastVisit || startTime > new Date(existing.lastVisit).getTime())) {
      existing.lastVisit = row.start_time;
    }
    if (
      (row.status === "pending" || row.status === "confirmed") &&
      startTime > now &&
      (!existing.nextUpcoming || startTime < new Date(existing.nextUpcoming).getTime())
    ) {
      existing.nextUpcoming = row.start_time;
    }

    byClient.set(client.id, existing);
  }

  return Array.from(byClient.values()).sort((a, b) => a.fullName.localeCompare(b.fullName, "ro"));
}

/** A single client's full booking history with this merchant, newest
 *  first. The client's own profile fields ride along on each row. */
export async function getMerchantClientBookings(merchantId: string, clientId: string): Promise<CalendarBooking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(CALENDAR_SELECT)
    .eq("merchant_id", merchantId)
    .eq("client_id", clientId)
    .order("start_time", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as CalendarBooking[];
}

export interface MerchantOverviewStats {
  bookingsToday: number;
  bookingsYesterday: number;
  revenueThisWeek: number;
  revenueLastWeek: number;
  revenueCurrency: string;
  newClientsThisMonth: number;
  newClientsLastMonth: number;
}

/**
 * Powers the four overview cards above the calendar. One all-time
 * bookings fetch backs every figure, so today/this-week/this-month and
 * their prior-period comparisons all agree with each other -- and with
 * the calendar's own date math (same rangeForView/timezone helpers).
 */
export async function getMerchantOverviewStats(
  merchantId: string,
  timezone: string,
): Promise<MerchantOverviewStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("client_id, status, start_time, created_at, price, currency")
    .eq("merchant_id", merchantId)
    .neq("status", "cancelled");

  if (error) throw error;
  const rows = data ?? [];

  const todayKey = todayInZone(timezone);
  const dayRange = rangeForView("day", todayKey);
  const yesterdayRange = rangeForView("day", addDays(todayKey, -1));
  const weekRange = rangeForView("week", todayKey);
  const lastWeekStartKey = addDays(weekRange.start, -7);
  const monthStartKey = startOfMonth(todayKey);
  const lastMonthStartKey = addMonths(monthStartKey, -1);

  const toMs = (dateKey: string) => zonedWallTimeToUtc(dateKey, "00:00", timezone).getTime();
  const dayStart = toMs(dayRange.start);
  const dayEnd = toMs(dayRange.end);
  const yesterdayStart = toMs(yesterdayRange.start);
  const yesterdayEnd = toMs(yesterdayRange.end);
  const weekStart = toMs(weekRange.start);
  const weekEnd = toMs(weekRange.end);
  const lastWeekStart = toMs(lastWeekStartKey);
  const monthStart = toMs(monthStartKey);
  const lastMonthStart = toMs(lastMonthStartKey);

  let bookingsToday = 0;
  let bookingsYesterday = 0;
  let revenueThisWeek = 0;
  let revenueLastWeek = 0;
  let revenueCurrency = "RON";
  const firstBookingByClient = new Map<string, number>();

  for (const row of rows) {
    const startMs = new Date(row.start_time).getTime();
    const createdMs = new Date(row.created_at).getTime();

    if (startMs >= dayStart && startMs < dayEnd) bookingsToday += 1;
    else if (startMs >= yesterdayStart && startMs < yesterdayEnd) bookingsYesterday += 1;

    if (row.status !== "pending") {
      if (startMs >= weekStart && startMs < weekEnd) {
        revenueThisWeek += Number(row.price);
        revenueCurrency = row.currency;
      } else if (startMs >= lastWeekStart && startMs < weekStart) {
        revenueLastWeek += Number(row.price);
      }
    }

    const prevFirst = firstBookingByClient.get(row.client_id);
    if (prevFirst === undefined || createdMs < prevFirst) {
      firstBookingByClient.set(row.client_id, createdMs);
    }
  }

  let newClientsThisMonth = 0;
  let newClientsLastMonth = 0;
  for (const firstMs of firstBookingByClient.values()) {
    if (firstMs >= monthStart) newClientsThisMonth += 1;
    else if (firstMs >= lastMonthStart && firstMs < monthStart) newClientsLastMonth += 1;
  }

  return {
    bookingsToday,
    bookingsYesterday,
    revenueThisWeek,
    revenueLastWeek,
    revenueCurrency,
    newClientsThisMonth,
    newClientsLastMonth,
  };
}
