import { createClient } from "@/lib/supabase/server";

export interface AdminOverviewStats {
  activeUsers: number;
  merchantsCount: number;
  activeMerchantsCount: number;
  bookingsCount: number;
  platformVolume: number;
  volumeCurrency: string;
}

/**
 * Platform-wide figures for the admin overview. RLS already grants
 * admins full select on profiles/merchants/bookings (is_admin()), so
 * these run as plain authenticated queries -- no service-role needed.
 */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const supabase = await createClient();

  const [usersResult, merchantsResult, activeMerchantsResult, bookingsResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).in("role", ["client", "merchant"]),
    supabase.from("merchants").select("id", { count: "exact", head: true }),
    supabase.from("merchants").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("bookings").select("price, currency, status").neq("status", "cancelled"),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (merchantsResult.error) throw merchantsResult.error;
  if (activeMerchantsResult.error) throw activeMerchantsResult.error;
  if (bookingsResult.error) throw bookingsResult.error;

  const bookingRows = bookingsResult.data ?? [];
  const platformVolume = bookingRows.reduce((sum, row) => sum + Number(row.price), 0);
  const volumeCurrency = bookingRows[0]?.currency ?? "RON";

  return {
    activeUsers: usersResult.count ?? 0,
    merchantsCount: merchantsResult.count ?? 0,
    activeMerchantsCount: activeMerchantsResult.count ?? 0,
    bookingsCount: bookingRows.length,
    platformVolume,
    volumeCurrency,
  };
}

export interface AdminMerchantRow {
  id: string;
  businessName: string;
  category: string;
  city: string | null;
  slug: string;
  createdAt: string;
  isActive: boolean;
  rating: number | null;
  ratingCount: number;
}

const ADMIN_MERCHANT_SELECT = "id, business_name, category, city, slug, created_at, is_active, rating, rating_count";

interface AdminMerchantSelectRow {
  id: string;
  business_name: string;
  category: string;
  city: string | null;
  slug: string;
  created_at: string;
  is_active: boolean;
  rating: number | null;
  rating_count: number;
}

function toAdminMerchantRow(row: AdminMerchantSelectRow): AdminMerchantRow {
  return {
    id: row.id,
    businessName: row.business_name,
    category: row.category,
    city: row.city,
    slug: row.slug,
    createdAt: row.created_at,
    isActive: row.is_active,
    rating: row.rating,
    ratingCount: row.rating_count,
  };
}

/** Newest-first merchants, for the overview's "Comercianți recenți" panel. */
export async function getRecentMerchants(limit = 6): Promise<AdminMerchantRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("merchants")
    .select(ADMIN_MERCHANT_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(toAdminMerchantRow);
}

/** Full merchants list for /admin/merchants -- no pagination yet, fine
 *  at today's scale (mirrors getAllMerchantBookings's same choice). */
export async function getAllMerchantsForAdmin(): Promise<AdminMerchantRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("merchants")
    .select(ADMIN_MERCHANT_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toAdminMerchantRow);
}
