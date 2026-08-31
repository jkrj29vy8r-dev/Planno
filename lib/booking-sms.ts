import { createClient } from "@/lib/supabase/server";
import { formatDateLong, formatTime } from "@/lib/format";
import { sendSms } from "@/lib/sms";

/**
 * Both functions here create their own Supabase client and never
 * throw -- they're meant to be called from inside `after()` (see the
 * call sites in lib/actions/bookings.ts and lib/actions/merchant.ts),
 * well past the point where a failure could still affect the booking
 * action that already succeeded. A fresh createClient() still has
 * access to the original request's cookies from inside `after()`,
 * which is what lets consume_sms_credit run as the actual signed-in
 * user rather than needing a separate service-role client.
 */

interface NewBookingSmsInput {
  merchantId: string;
  merchantPhone: string | null;
  clientName: string;
  clientPhone: string | null;
  serviceName: string;
  startTime: Date;
  timezone: string;
}

/** Merchant-facing "you have a new booking" SMS. Fires right when a
 *  booking is created -- status is 'pending' at that point, which is
 *  exactly what "new booking, needs your attention" means, so there's
 *  no timing mismatch here the way there would be for the client
 *  message below. */
export async function sendNewBookingMerchantSms(input: NewBookingSmsInput): Promise<void> {
  if (!input.merchantPhone) {
    console.error("[SMS] Merchant has no phone on file, skipping new-booking SMS", {
      merchantId: input.merchantId,
    });
    return;
  }

  const supabase = await createClient();
  const { data: hasCredit, error } = await supabase.rpc("consume_sms_credit", {
    target_merchant_id: input.merchantId,
  });

  if (error) {
    console.error("[SMS] Failed to consume merchant SMS credit", { merchantId: input.merchantId, error });
    return;
  }
  if (!hasCredit) {
    console.error("[SMS] Merchant has no SMS credits left, skipping new-booking SMS", {
      merchantId: input.merchantId,
    });
    return;
  }

  const message =
    `Programare nouă! Client: ${input.clientName}, Tel: ${input.clientPhone ?? "nespecificat"}, ` +
    `Serviciu: ${input.serviceName} pe ${formatDateLong(input.startTime, input.timezone)} ` +
    `la ora ${formatTime(input.startTime, input.timezone)}.`;

  const result = await sendSms(input.merchantPhone, message);
  if (!result.success) {
    console.error("[SMS] New-booking SMS to merchant failed", { merchantId: input.merchantId, error: result.error });
  }
}

interface BookingConfirmedSmsInput {
  merchantId: string;
  merchantName: string;
  clientPhone: string | null;
  serviceName: string;
  startTime: Date;
  timezone: string;
}

/** Client-facing "your booking is confirmed" SMS. Fires only on the
 *  actual pending -> confirmed transition, not at booking creation --
 *  every booking starts 'pending', so sending this at creation time
 *  would tell the client something that isn't true yet. Spends the
 *  same merchant SMS balance the new-booking message draws from. */
export async function sendBookingConfirmedClientSms(input: BookingConfirmedSmsInput): Promise<void> {
  if (!input.clientPhone) {
    console.error("[SMS] Client has no phone on file, skipping confirmation SMS", {
      merchantId: input.merchantId,
    });
    return;
  }

  const supabase = await createClient();
  const { data: hasCredit, error } = await supabase.rpc("consume_sms_credit", {
    target_merchant_id: input.merchantId,
  });

  if (error) {
    console.error("[SMS] Failed to consume merchant SMS credit", { merchantId: input.merchantId, error });
    return;
  }
  if (!hasCredit) {
    console.error("[SMS] Merchant has no SMS credits left, skipping confirmation SMS", {
      merchantId: input.merchantId,
    });
    return;
  }

  const message =
    `Programarea ta la ${input.merchantName} pentru ${input.serviceName} din ` +
    `${formatDateLong(input.startTime, input.timezone)} ora ${formatTime(input.startTime, input.timezone)} ` +
    `a fost confirmată!`;

  const result = await sendSms(input.clientPhone, message);
  if (!result.success) {
    console.error("[SMS] Confirmation SMS to client failed", { merchantId: input.merchantId, error: result.error });
  }
}
