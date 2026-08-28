import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

export type BookingWithDetails = Tables<"bookings"> & {
  merchant: Pick<Tables<"merchants">, "id" | "business_name" | "slug" | "city" | "timezone" | "working_hours">;
  service: Pick<Tables<"services">, "id" | "name" | "duration_minutes">;
};

const DETAIL_SELECT =
  "*, merchant:merchants(id, business_name, slug, city, timezone, working_hours), service:services(id, name, duration_minutes)";

export async function getUpcomingBookings(clientId: string): Promise<BookingWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(DETAIL_SELECT)
    .eq("client_id", clientId)
    .in("status", ["pending", "confirmed"])
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as BookingWithDetails[];
}

export async function getBookingHistory(clientId: string): Promise<BookingWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(DETAIL_SELECT)
    .eq("client_id", clientId)
    .in("status", ["completed", "cancelled"])
    .order("start_time", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as BookingWithDetails[];
}

export interface BookingNotification {
  id: string;
  bookingId: string;
  kind: "confirmed" | "cancelled_by_merchant" | "upcoming_soon" | "completed";
  message: string;
  merchantName: string;
  at: string;
}

/**
 * Notifications aren't a separate persisted table -- there's no inbox
 * to mark read/unread -- they're derived live from booking state that
 * already carries everything needed to explain itself (status,
 * cancelled_by, start_time). Computing them keeps the feed always
 * consistent with the bookings list, with nothing to fall out of sync.
 */
export async function getRecentNotifications(clientId: string): Promise<BookingNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, status, start_time, updated_at, cancelled_by, cancellation_reason, merchant:merchants(business_name)",
    )
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) throw error;

  const now = Date.now();
  const notifications: BookingNotification[] = [];

  for (const booking of data ?? []) {
    const merchantName = (booking.merchant as unknown as { business_name: string } | null)?.business_name ?? "Comerciant";
    const start = new Date(booking.start_time).getTime();

    if (booking.status === "confirmed") {
      notifications.push({
        id: `${booking.id}-confirmed`,
        bookingId: booking.id,
        kind: "confirmed",
        message: `${merchantName} ți-a confirmat rezervarea.`,
        merchantName,
        at: booking.updated_at,
      });
    }

    if (booking.status === "cancelled" && booking.cancelled_by !== clientId) {
      notifications.push({
        id: `${booking.id}-cancelled`,
        bookingId: booking.id,
        kind: "cancelled_by_merchant",
        message: `${merchantName} a anulat rezervarea${booking.cancellation_reason ? `: ${booking.cancellation_reason}` : "."}`,
        merchantName,
        at: booking.updated_at,
      });
    }

    if (booking.status === "completed") {
      notifications.push({
        id: `${booking.id}-completed`,
        bookingId: booking.id,
        kind: "completed",
        message: `Programarea ta la ${merchantName} s-a încheiat. Sperăm că ai avut o experiență plăcută!`,
        merchantName,
        at: booking.updated_at,
      });
    }

    if (
      (booking.status === "pending" || booking.status === "confirmed") &&
      start > now &&
      start - now < 48 * 3_600_000
    ) {
      notifications.push({
        id: `${booking.id}-upcoming`,
        bookingId: booking.id,
        kind: "upcoming_soon",
        message: `Programarea ta la ${merchantName} este în mai puțin de 48 de ore.`,
        merchantName,
        at: booking.start_time,
      });
    }
  }

  return notifications.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 8);
}
