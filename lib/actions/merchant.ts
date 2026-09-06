"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendBookingConfirmedClientSms } from "@/lib/booking-sms";
import { sendBookingConfirmedClientEmail } from "@/lib/booking-email";
import { MAX_GALLERY_IMAGES, storagePathFromPublicUrl } from "@/lib/merchant-media";
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

  // The joined columns are only needed for the "booking confirmed"
  // SMS/email below, not for the status update itself.
  //
  // client:profiles must name bookings_client_id_fkey explicitly --
  // bookings has a second FK to profiles (cancelled_by), so an
  // unqualified profiles(...) embed is ambiguous to PostgREST, which
  // returns 300 Multiple Choices for the whole request (the status
  // update included). See the identical note in
  // lib/actions/bookings.ts::createBookingAction.
  const { data: booking, error } = await supabase
    .from("bookings")
    .update(update)
    .eq("id", bookingId)
    .select(
      "merchant_id, start_time, merchant:merchants(business_name, timezone), service:services(name), client:profiles!bookings_client_id_fkey(phone, email)",
    )
    .single();

  if (error) {
    return { error: "Nu am putut actualiza statusul rezervării." };
  }

  // Only on the actual pending -> confirmed transition -- see
  // sendBookingConfirmedClientSms's own doc comment for why this can't
  // fire at booking creation instead.
  if (status === "confirmed") {
    const merchant = booking.merchant as unknown as { business_name: string; timezone: string } | null;
    const service = booking.service as unknown as { name: string } | null;
    const client = booking.client as unknown as { phone: string | null; email: string | null } | null;

    if (merchant && service && client) {
      after(() =>
        sendBookingConfirmedClientSms({
          merchantId: booking.merchant_id,
          merchantName: merchant.business_name,
          clientPhone: client.phone,
          serviceName: service.name,
          startTime: new Date(booking.start_time),
          timezone: merchant.timezone,
        }),
      );
      after(() =>
        sendBookingConfirmedClientEmail({
          clientEmail: client.email,
          merchantName: merchant.business_name,
          serviceName: service.name,
          startTime: new Date(booking.start_time),
          timezone: merchant.timezone,
        }),
      );
    }
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

export interface UpdateMerchantProfileInput {
  businessName: string;
  category: string;
  city: string;
  address?: string;
  phone?: string;
  description?: string;
}

/** The dashboard-editable subset of merchants -- mirrors
 *  CreateMerchantInput's fields (minus email, which has no field in
 *  this form) since they're the same "what the storefront shows"
 *  data, just editable after the fact instead of once at creation. */
export async function updateMerchantProfileAction(
  merchantId: string,
  input: UpdateMerchantProfileInput,
): Promise<MerchantActionState> {
  const businessName = input.businessName.trim();
  const city = input.city.trim();

  if (!businessName || !input.category || !city) {
    return { error: "Completează numele afacerii, categoria și orașul." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("merchants")
    .update({
      business_name: businessName,
      category: input.category,
      city,
      address: input.address?.trim() || null,
      phone: input.phone?.trim() || null,
      description: input.description?.trim() || null,
    })
    .eq("id", merchantId);

  if (error) {
    return { error: "Nu am putut salva modificările." };
  }

  revalidatePath("/merchant/dashboard", "layout");
  revalidatePath("/merchants", "layout");
  return { success: true };
}

type MerchantImageKind = "logo" | "cover";

/**
 * The file itself now uploads directly from the browser to Storage
 * (see MerchantImageUpload/MerchantGalleryManager) instead of through
 * here: Server Actions cap the request body at 1MB by default, well
 * under a real phone photo, so routing file bytes through an action
 * would silently reject exactly the uploads this feature exists for.
 * These actions only ever receive the resulting public URL -- a few
 * hundred bytes -- and this checks it actually belongs to the caller
 * before trusting it into a merchants column. The bucket's own
 * file_size_limit and allowed_mime_types (set in the
 * merchant_profile_media migration) are what actually gate the
 * upload now, the same way RLS gates a table write regardless of what
 * the client claims.
 */
async function verifyOwnMediaUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  url: string,
): Promise<{ error: string } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Trebuie să fii autentificat." };

  const path = storagePathFromPublicUrl(url);
  if (!path || !path.startsWith(`${user.id}/`)) {
    return { error: "Imagine invalidă." };
  }
  return null;
}

export async function setMerchantImageUrlAction(
  merchantId: string,
  kind: MerchantImageKind,
  url: string,
): Promise<MerchantActionState> {
  const supabase = await createClient();
  const invalid = await verifyOwnMediaUrl(supabase, url);
  if (invalid) return invalid;

  const update = kind === "logo" ? { logo_url: url } : { cover_image_url: url };
  const { error } = await supabase.from("merchants").update(update).eq("id", merchantId);

  if (error) {
    return { error: "Nu am putut actualiza profilul." };
  }

  revalidatePath("/merchant/dashboard", "layout");
  revalidatePath("/merchants", "layout");
  return { success: true };
}

export async function clearMerchantImageUrlAction(
  merchantId: string,
  kind: MerchantImageKind,
): Promise<MerchantActionState> {
  const supabase = await createClient();

  const { data: merchant, error: fetchError } = await supabase
    .from("merchants")
    .select("logo_url, cover_image_url")
    .eq("id", merchantId)
    .single();

  if (fetchError || !merchant) {
    return { error: "Nu am găsit afacerea." };
  }

  const currentUrl = kind === "logo" ? merchant.logo_url : merchant.cover_image_url;
  const update = kind === "logo" ? { logo_url: null } : { cover_image_url: null };
  const { error } = await supabase.from("merchants").update(update).eq("id", merchantId);

  if (error) {
    return { error: "Nu am putut actualiza profilul." };
  }

  // Best-effort, same as removeMerchantGalleryImageAction: the DB write
  // above is what actually controls whether the image still shows
  // anywhere.
  if (currentUrl) {
    const path = storagePathFromPublicUrl(currentUrl);
    if (path) {
      await supabase.storage.from("merchant-media").remove([path]);
    }
  }

  revalidatePath("/merchant/dashboard", "layout");
  revalidatePath("/merchants", "layout");
  return { success: true };
}

export async function addMerchantGalleryUrlAction(merchantId: string, url: string): Promise<MerchantActionState> {
  const supabase = await createClient();
  const invalid = await verifyOwnMediaUrl(supabase, url);
  if (invalid) return invalid;

  const { data: merchant, error: fetchError } = await supabase
    .from("merchants")
    .select("gallery_urls")
    .eq("id", merchantId)
    .single();

  if (fetchError || !merchant) {
    return { error: "Nu am găsit afacerea." };
  }
  // The client already checks this against its own local state before
  // ever starting the upload; this is the authoritative re-check
  // against a stale-state race, not the first line of defense.
  if (merchant.gallery_urls.length >= MAX_GALLERY_IMAGES) {
    return { error: `Poți adăuga maximum ${MAX_GALLERY_IMAGES} fotografii.` };
  }

  const { error: updateError } = await supabase
    .from("merchants")
    .update({ gallery_urls: [...merchant.gallery_urls, url] })
    .eq("id", merchantId);

  if (updateError) {
    return { error: "Nu am putut actualiza galeria." };
  }

  revalidatePath("/merchant/dashboard", "layout");
  revalidatePath("/merchants", "layout");
  return { success: true };
}

export async function removeMerchantGalleryImageAction(
  merchantId: string,
  imageUrl: string,
): Promise<MerchantActionState> {
  const supabase = await createClient();
  const { data: merchant, error: fetchError } = await supabase
    .from("merchants")
    .select("gallery_urls")
    .eq("id", merchantId)
    .single();

  if (fetchError || !merchant) {
    return { error: "Nu am găsit afacerea." };
  }

  const { error: updateError } = await supabase
    .from("merchants")
    .update({ gallery_urls: merchant.gallery_urls.filter((url) => url !== imageUrl) })
    .eq("id", merchantId);

  if (updateError) {
    return { error: "Nu am putut elimina imaginea." };
  }

  // Best-effort: the DB write above is what actually controls whether
  // the image is still shown anywhere, so a failure to delete the
  // underlying object (already gone, transient network error) doesn't
  // need to surface as a user-facing error.
  const path = storagePathFromPublicUrl(imageUrl);
  if (path) {
    await supabase.storage.from("merchant-media").remove([path]);
  }

  revalidatePath("/merchant/dashboard", "layout");
  revalidatePath("/merchants", "layout");
  return { success: true };
}
