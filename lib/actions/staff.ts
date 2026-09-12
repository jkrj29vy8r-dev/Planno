"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifyOwnMediaUrl } from "@/lib/actions/merchant";
import { getStaffForService } from "@/lib/data/staff";
import { MAX_GALLERY_IMAGES, storagePathFromPublicUrl } from "@/lib/merchant-media";
import type { Json, Tables } from "@/types/database.types";

/** Thin wrapper so the public booking flow (a client component) can
 *  ask "which staff can do this service" without a dedicated data
 *  fetch of its own -- same read lib/data/staff.ts already does for
 *  the server-rendered team roster, just callable from the client. */
export async function getStaffForServiceAction(merchantId: string, serviceId: string): Promise<Tables<"staff_members">[]> {
  return getStaffForService(merchantId, serviceId);
}

export interface StaffActionState {
  error?: string;
  success?: boolean;
}

export interface StaffInput {
  name: string;
  title?: string;
  bio?: string;
  /** The full desired set of services this staff member can perform --
   *  create/update both replace staff_services wholesale to match it,
   *  rather than taking an add/remove delta, so the caller (a
   *  checkbox list reflecting current state) never has to compute one. */
  serviceIds: string[];
}

async function replaceStaffServices(staffId: string, serviceIds: string[]): Promise<{ error: string } | null> {
  const supabase = await createClient();

  const { error: deleteError } = await supabase.from("staff_services").delete().eq("staff_id", staffId);
  if (deleteError) return { error: "Nu am putut actualiza serviciile specialistului." };

  if (serviceIds.length === 0) return null;

  const { error: insertError } = await supabase
    .from("staff_services")
    .insert(serviceIds.map((serviceId) => ({ staff_id: staffId, service_id: serviceId })));

  // Only real failure mode here is enforce_staff_service_same_merchant
  // (a service id from outside this merchant) -- unreachable through
  // the dashboard's own checkbox list, which only ever offers this
  // merchant's own services, but still surfaced rather than swallowed.
  if (insertError) return { error: "Nu am putut asocia unul dintre servicii cu acest specialist." };

  return null;
}

export async function createStaffAction(
  merchantId: string,
  input: StaffInput,
): Promise<StaffActionState & { staffId?: string }> {
  const name = input.name.trim();
  if (!name) {
    return { error: "Completează numele specialistului." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_members")
    .insert({
      merchant_id: merchantId,
      name,
      title: input.title?.trim() || null,
      bio: input.bio?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Nu am putut adăuga specialistul." };
  }

  const assignError = await replaceStaffServices(data.id, input.serviceIds);
  if (assignError) return assignError;

  revalidatePath("/merchant/dashboard/staff");
  revalidatePath("/merchants", "layout");
  return { success: true, staffId: data.id };
}

export async function updateStaffAction(staffId: string, input: StaffInput): Promise<StaffActionState> {
  const name = input.name.trim();
  if (!name) {
    return { error: "Completează numele specialistului." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("staff_members")
    .update({
      name,
      title: input.title?.trim() || null,
      bio: input.bio?.trim() || null,
    })
    .eq("id", staffId);

  if (error) {
    return { error: "Nu am putut salva modificările." };
  }

  const assignError = await replaceStaffServices(staffId, input.serviceIds);
  if (assignError) return assignError;

  revalidatePath("/merchant/dashboard/staff");
  revalidatePath("/merchants", "layout");
  return { success: true };
}

export async function setStaffActiveAction(staffId: string, isActive: boolean): Promise<StaffActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("staff_members").update({ is_active: isActive }).eq("id", staffId);

  if (error) {
    return { error: "Nu am putut actualiza specialistul." };
  }

  revalidatePath("/merchant/dashboard/staff");
  revalidatePath("/merchants", "layout");
  return { success: true };
}

export async function updateStaffWorkingHoursAction(staffId: string, workingHours: Json): Promise<StaffActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("staff_members").update({ working_hours: workingHours }).eq("id", staffId);

  if (error) {
    return { error: "Nu am putut salva programul specialistului." };
  }

  revalidatePath("/merchant/dashboard/staff");
  revalidatePath("/merchants", "layout");
  return { success: true };
}

export async function setStaffAvatarUrlAction(staffId: string, url: string): Promise<StaffActionState> {
  const supabase = await createClient();
  const invalid = await verifyOwnMediaUrl(supabase, url);
  if (invalid) return invalid;

  const { error } = await supabase.from("staff_members").update({ avatar_url: url }).eq("id", staffId);
  if (error) return { error: "Nu am putut actualiza fotografia." };

  revalidatePath("/merchant/dashboard/staff");
  revalidatePath("/merchants", "layout");
  return { success: true };
}

export async function clearStaffAvatarUrlAction(staffId: string): Promise<StaffActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("staff_members").update({ avatar_url: null }).eq("id", staffId);
  if (error) return { error: "Nu am putut actualiza fotografia." };

  revalidatePath("/merchant/dashboard/staff");
  revalidatePath("/merchants", "layout");
  return { success: true };
}

export async function addStaffGalleryUrlAction(staffId: string, url: string): Promise<StaffActionState> {
  const supabase = await createClient();
  const invalid = await verifyOwnMediaUrl(supabase, url);
  if (invalid) return invalid;

  const { data: staff, error: fetchError } = await supabase
    .from("staff_members")
    .select("gallery_urls")
    .eq("id", staffId)
    .single();

  if (fetchError || !staff) {
    return { error: "Nu am găsit specialistul." };
  }
  if (staff.gallery_urls.length >= MAX_GALLERY_IMAGES) {
    return { error: `Poți adăuga maximum ${MAX_GALLERY_IMAGES} fotografii.` };
  }

  const { error: updateError } = await supabase
    .from("staff_members")
    .update({ gallery_urls: [...staff.gallery_urls, url] })
    .eq("id", staffId);

  if (updateError) return { error: "Nu am putut actualiza galeria." };

  revalidatePath("/merchant/dashboard/staff");
  revalidatePath("/merchants", "layout");
  return { success: true };
}

export async function removeStaffGalleryImageAction(staffId: string, imageUrl: string): Promise<StaffActionState> {
  const supabase = await createClient();
  const { data: staff, error: fetchError } = await supabase
    .from("staff_members")
    .select("gallery_urls")
    .eq("id", staffId)
    .single();

  if (fetchError || !staff) {
    return { error: "Nu am găsit specialistul." };
  }

  const { error: updateError } = await supabase
    .from("staff_members")
    .update({ gallery_urls: staff.gallery_urls.filter((url) => url !== imageUrl) })
    .eq("id", staffId);

  if (updateError) return { error: "Nu am putut elimina imaginea." };

  // Best-effort, same as the merchant gallery's own remove action: the
  // DB write above is what actually controls whether the image is
  // still shown anywhere.
  const path = storagePathFromPublicUrl(imageUrl);
  if (path) {
    await supabase.storage.from("merchant-media").remove([path]);
  }

  revalidatePath("/merchant/dashboard/staff");
  revalidatePath("/merchants", "layout");
  return { success: true };
}
