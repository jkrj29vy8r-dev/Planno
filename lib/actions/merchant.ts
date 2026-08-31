"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json, TablesUpdate } from "@/types/database.types";

export interface MerchantActionState {
  error?: string;
  success?: boolean;
}

/** "Frizeria Ștefan" -> "frizeria-stefan" -- strips Romanian diacritics
 *  via Unicode decomposition rather than a hand-written replacement
 *  map, then collapses everything outside [a-z0-9] into single
 *  hyphens to satisfy the merchants.slug check constraint. */
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Tries the plain slug first, then -2, -3, ... against real
 *  collisions -- cheap since this only runs once, at business
 *  creation, not on every read. */
async function generateUniqueSlug(businessName: string): Promise<string> {
  const supabase = await createClient();
  const base = slugify(businessName) || "afacere";

  for (let attempt = 1; attempt <= 25; attempt += 1) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`;
    const { data, error } = await supabase.from("merchants").select("id").eq("slug", candidate).maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}

export interface CreateMerchantInput {
  businessName: string;
  category: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
}

/** The one-time step between "signed up as a merchant" and "has a
 *  real dashboard" -- merchants_insert_own RLS is the actual gate
 *  (owner_id = auth.uid() and has_role('merchant')), this just gives
 *  friendly errors and fills in the slug. Everything not collected
 *  here (working hours, logo, cover photo) keeps the schema's own
 *  sane defaults and is editable afterward from the dashboard. */
export async function createMerchantAction(input: CreateMerchantInput): Promise<MerchantActionState> {
  const businessName = input.businessName.trim();
  const city = input.city.trim();

  if (!businessName || !input.category || !city) {
    return { error: "Completează numele afacerii, categoria și orașul." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Trebuie să fii autentificat." };
  }

  const slug = await generateUniqueSlug(businessName);

  const { error } = await supabase.from("merchants").insert({
    owner_id: user.id,
    business_name: businessName,
    slug,
    category: input.category,
    city,
    address: input.address?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    description: input.description?.trim() || null,
  });

  if (error) {
    return { error: "Nu am putut crea afacerea. Încearcă din nou." };
  }

  revalidatePath("/merchant/dashboard", "layout");
  return { success: true };
}

type MerchantBookingStatus = "confirmed" | "completed" | "no_show" | "cancelled";

/** The only status changes a merchant may make -- enforced again by the
 *  enforce_booking_update_rules trigger, this just gives a friendly
 *  error instead of a raw Postgres one for the common mistakes. */
export async function updateMerchantBookingStatusAction(
  bookingId: string,
  status: MerchantBookingStatus,
  note?: string,
): Promise<MerchantActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Trebuie să fii autentificat." };
  }

  const update: TablesUpdate<"bookings"> = { status };
  if (note) {
    if (status === "cancelled") update.cancellation_reason = note;
    else update.merchant_notes = note;
  }

  const { error } = await supabase.from("bookings").update(update).eq("id", bookingId);

  if (error) {
    return { error: "Nu am putut actualiza statusul rezervării." };
  }

  revalidatePath("/merchant/dashboard");
  revalidatePath("/merchant/dashboard/clients", "layout");
  return { success: true };
}

export interface ServiceInput {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  durationMinutes: number;
}

export async function createServiceAction(merchantId: string, input: ServiceInput): Promise<MerchantActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    merchant_id: merchantId,
    name: input.name,
    description: input.description || null,
    price: input.price,
    currency: input.currency || "RON",
    duration_minutes: input.durationMinutes,
  });

  if (error) {
    return { error: "Nu am putut adăuga serviciul." };
  }

  revalidatePath("/merchant/dashboard/services");
  return { success: true };
}

export async function updateServiceAction(serviceId: string, input: ServiceInput): Promise<MerchantActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      name: input.name,
      description: input.description || null,
      price: input.price,
      currency: input.currency || "RON",
      duration_minutes: input.durationMinutes,
    })
    .eq("id", serviceId);

  if (error) {
    return { error: "Nu am putut actualiza serviciul." };
  }

  revalidatePath("/merchant/dashboard/services");
  return { success: true };
}

export async function setServiceActiveAction(serviceId: string, isActive: boolean): Promise<MerchantActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("services").update({ is_active: isActive }).eq("id", serviceId);

  if (error) {
    return { error: "Nu am putut actualiza serviciul." };
  }

  revalidatePath("/merchant/dashboard/services");
  return { success: true };
}

export async function updateWorkingHoursAction(merchantId: string, workingHours: Json): Promise<MerchantActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("merchants").update({ working_hours: workingHours }).eq("id", merchantId);

  if (error) {
    return { error: "Nu am putut salva programul de lucru." };
  }

  revalidatePath("/merchant/dashboard/program");
  revalidatePath("/merchants", "layout");
  return { success: true };
}
