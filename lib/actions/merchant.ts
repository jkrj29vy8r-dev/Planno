"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json, TablesUpdate } from "@/types/database.types";

export interface MerchantActionState {
  error?: string;
  success?: boolean;
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
