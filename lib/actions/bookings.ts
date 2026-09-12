"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendNewBookingMerchantSms } from "@/lib/booking-sms";
import { sendNewBookingMerchantEmail } from "@/lib/booking-email";
import { isWithinWorkingHours } from "@/lib/data/availability";
import { getStaffForService } from "@/lib/data/staff";
import type { Json, Tables } from "@/types/database.types";

export interface BookingActionState {
  error?: string;
  success?: boolean;
}

/** Postgres SQLSTATE for an EXCLUDE constraint violation -- this is
 *  exactly what bookings_no_overlap raises when two clients race for
 *  the same slot, so it gets its own friendly message. */
const EXCLUSION_VIOLATION = "23P01";

/** A resolved booking target: the merchant itself (no staff involved,
 *  every call site that predates staff members and every merchant that
 *  never adopts them) or one specific staff member, each with the
 *  working_hours/timezone that actually govern that resource. */
interface BookingCandidate {
  staffId: string | null;
  workingHours: Json;
  timezone: string;
}

export async function createBookingAction(input: {
  merchantId: string;
  serviceId: string;
  startTime: string;
  clientNotes?: string;
  /** A specific staff member's id, "any" for "orice specialist
   *  disponibil", or omitted -- the pre-staff behavior. */
  staffId?: string | "any";
}): Promise<BookingActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Trebuie să fii autentificat pentru a face o rezervare." };
  }

  const { data: bookableService, error: bookableServiceError } = await supabase
    .from("services")
    .select("duration_minutes, merchant:merchants(working_hours, timezone)")
    .eq("id", input.serviceId)
    .single();

  if (bookableServiceError || !bookableService) {
    return { error: "Serviciul nu mai există sau nu mai este disponibil." };
  }

  const serviceMerchant = bookableService.merchant as unknown as { working_hours: Json; timezone: string } | null;
  if (!serviceMerchant) {
    return { error: "Serviciul nu mai există sau nu mai este disponibil." };
  }

  // Candidates to try, in order -- more than one only for "any", where
  // a slot the UI offered can still lose a race against another client
  // for the *first* qualifying specialist without the booking needing
  // to fail outright while a second one is just as genuinely free.
  let candidates: BookingCandidate[];

  if (input.staffId === "any") {
    const staff = await getStaffForService(input.merchantId, input.serviceId);
    candidates =
      staff.length > 0
        ? staff.map((member) => ({ staffId: member.id, workingHours: member.working_hours, timezone: serviceMerchant.timezone }))
        : [{ staffId: null, workingHours: serviceMerchant.working_hours, timezone: serviceMerchant.timezone }];
  } else if (input.staffId) {
    const staff = await getStaffForService(input.merchantId, input.serviceId);
    const chosen = staff.find((member) => member.id === input.staffId);
    if (!chosen) {
      return { error: "Specialistul ales nu mai este disponibil pentru acest serviciu." };
    }
    candidates = [{ staffId: chosen.id, workingHours: chosen.working_hours, timezone: serviceMerchant.timezone }];
  } else {
    candidates = [{ staffId: null, workingHours: serviceMerchant.working_hours, timezone: serviceMerchant.timezone }];
  }

  const startTime = new Date(input.startTime);
  const endTime = new Date(startTime.getTime() + bookableService.duration_minutes * 60_000);

  // getAvailableSlots (lib/data/availability.ts) already keeps the UI
  // from ever offering an out-of-hours slot, but nothing before this
  // re-checked a request built outside that flow -- the exclusion
  // constraint below only ever catches double-bookings, never this.
  // A candidate outside its own hours is dropped rather than failing
  // the whole booking, so "any" still tries the others.
  candidates = candidates.filter((c) => isWithinWorkingHours(startTime, endTime, c.workingHours, c.timezone));
  if (candidates.length === 0) {
    return { error: "Acest interval este în afara programului de lucru." };
  }

  // end_time/price are recomputed by the derive_booking_price_and_duration
  // trigger from service_id + start_time -- what's sent here for them
  // never actually reaches storage. The joined columns below aren't
  // needed for the booking itself, only for the "new booking" SMS/email
  // fired after this returns.
  //
  // client:profiles must name bookings_client_id_fkey explicitly --
  // bookings has a second FK to profiles (cancelled_by), so PostgREST
  // can't infer which one an unqualified profiles(...) embed means and
  // returns 300 Multiple Choices for the whole request, insert
  // included (this silently killed every booking attempt until the
  // hint was added here).
  type BookingWithRelations = {
    start_time: string;
    merchant: Pick<Tables<"merchants">, "business_name" | "phone" | "email" | "timezone"> | null;
    service: { name: string } | null;
    client: { full_name: string; phone: string | null } | null;
  };
  let booking: BookingWithRelations | null = null;
  let lastError: { code?: string } | null = null;

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        merchant_id: input.merchantId,
        client_id: user.id,
        service_id: input.serviceId,
        staff_id: candidate.staffId,
        start_time: input.startTime,
        end_time: input.startTime,
        client_notes: input.clientNotes || null,
      })
      .select(
        "start_time, merchant:merchants(business_name, phone, email, timezone), service:services(name), client:profiles!bookings_client_id_fkey(full_name, phone)",
      )
      .single();

    if (!error) {
      booking = data as unknown as BookingWithRelations;
      break;
    }

    lastError = error;
    if (error.code !== EXCLUSION_VIOLATION) break;
    // Exclusion violation with more candidates left ("any" only): that
    // specific specialist just got taken, try the next one.
  }

  if (!booking) {
    if (lastError?.code === EXCLUSION_VIOLATION) {
      return { error: "Acest interval tocmai a fost rezervat de altcineva. Alege alt interval." };
    }
    // Anything else here is almost always bookings_insert_client's own
    // RLS check failing silently (RLS violations carry no distinct
    // code to branch on the way the overlap exclusion above does) --
    // logged so a merchant's subscription/active-service state can
    // actually be diagnosed instead of guessed at from a generic
    // "couldn't create the booking" report.
    console.error("[Rezervări] Failed to create booking", { input, error: lastError });
    return { error: "Nu am putut crea rezervarea. Încearcă din nou." };
  }

  // Fire-and-forget: after() runs this once the response has already
  // gone out, so a slow or down SMS/email provider can never delay or
  // fail a booking that already succeeded.
  const { merchant, service, client } = booking;

  if (merchant && service && client) {
    after(() =>
      sendNewBookingMerchantSms({
        merchantId: input.merchantId,
        merchantPhone: merchant.phone,
        clientName: client.full_name,
        clientPhone: client.phone,
        serviceName: service.name,
        startTime: new Date(booking.start_time),
        timezone: merchant.timezone,
      }),
    );
    after(() =>
      sendNewBookingMerchantEmail({
        merchantEmail: merchant.email,
        clientName: client.full_name,
        clientPhone: client.phone,
        serviceName: service.name,
        startTime: new Date(booking.start_time),
        timezone: merchant.timezone,
      }),
    );
  }

  revalidatePath("/client/dashboard");
  return { success: true };
}

export async function cancelBookingAction(
  bookingId: string,
  reason?: string,
): Promise<BookingActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Trebuie să fii autentificat." };
  }

  // No ownership/status check here: RLS (bookings_update_own_client)
  // and the enforce_booking_update_rules trigger already reject
  // anything that isn't the caller's own pending/confirmed booking.
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", cancellation_reason: reason || null })
    .eq("id", bookingId);

  if (error) {
    return { error: "Nu am putut anula rezervarea." };
  }

  revalidatePath("/client/dashboard");
  return { success: true };
}

export async function rescheduleBookingAction(input: {
  bookingId: string;
  newStartTime: string;
}): Promise<BookingActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Trebuie să fii autentificat." };
  }

  const { error } = await supabase.rpc("reschedule_booking", {
    p_old_booking_id: input.bookingId,
    p_new_start_time: input.newStartTime,
  });

  if (error) {
    if (error.code === EXCLUSION_VIOLATION) {
      return { error: "Acest interval tocmai a fost rezervat de altcineva. Alege alt interval." };
    }
    return { error: "Nu am putut reprograma rezervarea. Încearcă din nou." };
  }

  revalidatePath("/client/dashboard");
  return { success: true };
}
