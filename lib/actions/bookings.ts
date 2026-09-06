"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendNewBookingMerchantSms } from "@/lib/booking-sms";
import { sendNewBookingMerchantEmail } from "@/lib/booking-email";

export interface BookingActionState {
  error?: string;
  success?: boolean;
}

/** Postgres SQLSTATE for an EXCLUDE constraint violation -- this is
 *  exactly what bookings_no_overlap raises when two clients race for
 *  the same slot, so it gets its own friendly message. */
const EXCLUSION_VIOLATION = "23P01";

export async function createBookingAction(input: {
  merchantId: string;
  serviceId: string;
  startTime: string;
  clientNotes?: string;
}): Promise<BookingActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Trebuie să fii autentificat pentru a face o rezervare." };
  }

  // end_time/price are recomputed by the derive_booking_price_and_duration
  // trigger from service_id + start_time -- what's sent here for them
  // never actually reaches storage. The joined columns below aren't
  // needed for the booking itself, only for the "new booking" SMS
  // fired after this returns.
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      merchant_id: input.merchantId,
      client_id: user.id,
      service_id: input.serviceId,
      start_time: input.startTime,
      end_time: input.startTime,
      client_notes: input.clientNotes || null,
    })
    .select(
      "start_time, merchant:merchants(business_name, phone, email, timezone), service:services(name), client:profiles(full_name, phone)",
    )
    .single();

  if (error) {
    if (error.code === EXCLUSION_VIOLATION) {
      return { error: "Acest interval tocmai a fost rezervat de altcineva. Alege alt interval." };
    }
    return { error: "Nu am putut crea rezervarea. Încearcă din nou." };
  }

  // Fire-and-forget: after() runs this once the response has already
  // gone out, so a slow or down SMS/email provider can never delay or
  // fail a booking that already succeeded.
  const merchant = booking.merchant as unknown as {
    business_name: string;
    phone: string | null;
    email: string | null;
    timezone: string;
  } | null;
  const service = booking.service as unknown as { name: string } | null;
  const client = booking.client as unknown as { full_name: string; phone: string | null } | null;

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
