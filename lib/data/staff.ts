import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

export type StaffMember = Tables<"staff_members">;

/** Every staff member the merchant has, active or not -- the dashboard
 *  roster needs to show and let the owner re-activate a deactivated
 *  one, not just the bookable subset. */
export async function getMerchantStaff(merchantId: string): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export type StaffWithServiceIds = StaffMember & { serviceIds: string[] };

/** Two plain queries joined in JS (staff, then every staff_services row
 *  for them), not one embedded/nested-filter query -- matches how the
 *  rest of this codebase composes cross-table reads (see
 *  getMerchantClients) and keeps the join trivial to reason about
 *  rather than depending on PostgREST's embedded-filter syntax typing
 *  cleanly for a correctness-sensitive page. */
export async function getMerchantStaffWithServices(merchantId: string): Promise<StaffWithServiceIds[]> {
  const staff = await getMerchantStaff(merchantId);
  if (staff.length === 0) return [];

  const supabase = await createClient();
  const { data: assignments, error } = await supabase
    .from("staff_services")
    .select("staff_id, service_id")
    .in(
      "staff_id",
      staff.map((s) => s.id),
    );

  if (error) throw error;

  const serviceIdsByStaff = new Map<string, string[]>();
  for (const row of assignments ?? []) {
    const list = serviceIdsByStaff.get(row.staff_id) ?? [];
    list.push(row.service_id);
    serviceIdsByStaff.set(row.staff_id, list);
  }

  return staff.map((member) => ({ ...member, serviceIds: serviceIdsByStaff.get(member.id) ?? [] }));
}

/** Active staff qualified for a given service -- backs both the
 *  booking flow's specialist picker and "any available"'s candidate
 *  list. Deliberately re-checks merchant_id and is_active here rather
 *  than trusting staff_services alone: the join table's own rows never
 *  go stale (rows are deleted, not flagged), but a staff member can be
 *  deactivated without touching staff_services at all. */
export async function getStaffForService(merchantId: string, serviceId: string): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data: assignments, error: assignmentsError } = await supabase
    .from("staff_services")
    .select("staff_id")
    .eq("service_id", serviceId);

  if (assignmentsError) throw assignmentsError;

  const staffIds = (assignments ?? []).map((row) => row.staff_id);
  if (staffIds.length === 0) return [];

  const { data: staff, error: staffError } = await supabase
    .from("staff_members")
    .select("*")
    .in("id", staffIds)
    .eq("merchant_id", merchantId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (staffError) throw staffError;
  return staff ?? [];
}

/** Active staff, for the public profile's team section -- no
 *  serviceIds attached, that pairing only matters inside the booking
 *  flow and the dashboard editor. */
export async function getActiveStaff(merchantId: string): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("merchant_id", merchantId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getStaffServiceIds(staffId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("staff_services").select("service_id").eq("staff_id", staffId);
  if (error) throw error;
  return (data ?? []).map((row) => row.service_id);
}

export async function getStaffById(staffId: string): Promise<StaffMember | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("staff_members").select("*").eq("id", staffId).maybeSingle();
  if (error) throw error;
  return data;
}
