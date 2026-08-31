import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface PlatformStats {
  merchants: number;
  services: number;
  cities: number;
  /** Bookings made in the last 30 days. */
  bookingsLast30Days: number;
  /** Platform-wide, weighted by each merchant's own review count --
   *  null until at least one merchant has a review. */
  averageRating: number | null;
  ratingCount: number;
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

  const [merchants, services, bookings, cityRows, ratingRows] = await Promise.all([
    supabase.from("merchants").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("services").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("merchants").select("city").eq("is_active", true),
    // merchants.rating/rating_count are already maintained per merchant
    // by the reviews trigger, so the platform average is a weighted mean
    // over that small set rather than a full scan of the reviews table.
    supabase.from("merchants").select("rating, rating_count").eq("is_active", true).gt("rating_count", 0),
  ]);

  const cities = new Set(
    (cityRows.data ?? []).map((row) => row.city).filter((city): city is string => Boolean(city)),
  );

  const ratingCount = (ratingRows.data ?? []).reduce((sum, m) => sum + m.rating_count, 0);
  const weightedSum = (ratingRows.data ?? []).reduce((sum, m) => sum + (m.rating ?? 0) * m.rating_count, 0);

  return {
    merchants: merchants.count ?? 0,
    services: services.count ?? 0,
    cities: cities.size,
    bookingsLast30Days: bookings.count ?? 0,
    averageRating: ratingCount > 0 ? weightedSum / ratingCount : null,
    ratingCount,
  };
});
