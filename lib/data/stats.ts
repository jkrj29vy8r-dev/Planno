import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface PlatformStats {
  merchants: number;
  services: number;
  cities: number;
  /** Bookings made in the last 30 days. */
  bookingsLast30Days: number;
}

/**
 * Real counts for the home page's trust row.
 *
 * Deliberately measured rather than hard-coded: social proof shown to
 * end users is a factual claim, and a number that drifts from reality
 * is one nobody can defend. Uses head:true count queries so no rows
 * cross the wire.
 */
export const getPlatformStats = cache(async (): Promise<PlatformStats> => {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [merchants, services, bookings, cityRows] = await Promise.all([
    supabase.from("merchants").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("services").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("merchants").select("city").eq("is_active", true),
  ]);

  const cities = new Set(
    (cityRows.data ?? []).map((row) => row.city).filter((city): city is string => Boolean(city)),
  );

  return {
    merchants: merchants.count ?? 0,
    services: services.count ?? 0,
    cities: cities.size,
    bookingsLast30Days: bookings.count ?? 0,
  };
});
