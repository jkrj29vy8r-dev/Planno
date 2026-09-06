import { sendEmail } from "@/lib/email";
import { formatDateLong, formatTime } from "@/lib/format";

/**
 * Both functions here never throw -- they're meant to be called from
 * inside `after()` (see the call sites in lib/actions/bookings.ts and
 * lib/actions/merchant.ts), well past the point where a failure could
 * still affect the booking action that already succeeded.
 *
 * Unlike the SMS twins in booking-sms.ts, these don't spend
 * consume_sms_credit -- email costs the platform nothing per send the
 * way SMS does, so there's no reason to meter it against the same
 * merchant balance. If that turns out wrong, gate it here rather than
 * in email.ts, which has no notion of bookings or credits.
 */

interface NewBookingEmailInput {
  merchantEmail: string | null;
  clientName: string;
  clientPhone: string | null;
  serviceName: string;
  startTime: Date;
  timezone: string;
}

/** Merchant-facing "you have a new booking" email. Fires right when a
 *  booking is created -- status is 'pending' at that point, which is
 *  exactly what "new booking, needs your attention" means, so there's
 *  no timing mismatch here the way there would be for the client
 *  message below. */
export async function sendNewBookingMerchantEmail(input: NewBookingEmailInput): Promise<void> {
  if (!input.merchantEmail) {
    console.error("[Email] Merchant has no email on file, skipping new-booking email");
    return;
  }

  const when = `${formatDateLong(input.startTime, input.timezone)} ora ${formatTime(input.startTime, input.timezone)}`;
  const html = `
    <p>Ai o programare nouă pe Planno.</p>
    <ul>
      <li><strong>Client:</strong> ${input.clientName}</li>
      <li><strong>Telefon:</strong> ${input.clientPhone ?? "nespecificat"}</li>
      <li><strong>Serviciu:</strong> ${input.serviceName}</li>
      <li><strong>Data:</strong> ${when}</li>
    </ul>
    <p>Confirm-o din panoul tău de comerciant.</p>
  `.trim();

  const result = await sendEmail(input.merchantEmail, "Programare nouă pe Planno", html);
  if (!result.success) {
    console.error("[Email] New-booking email to merchant failed", { error: result.error });
  }
}

interface BookingConfirmedEmailInput {
  clientEmail: string | null;
  merchantName: string;
  serviceName: string;
  startTime: Date;
  timezone: string;
}

/** Client-facing "your booking is confirmed" email. Fires only on the
 *  actual pending -> confirmed transition, not at booking creation --
 *  every booking starts 'pending', so sending this at creation time
 *  would tell the client something that isn't true yet. */
export async function sendBookingConfirmedClientEmail(input: BookingConfirmedEmailInput): Promise<void> {
  if (!input.clientEmail) {
    console.error("[Email] Client has no email on file, skipping confirmation email");
    return;
  }

  const when = `${formatDateLong(input.startTime, input.timezone)} ora ${formatTime(input.startTime, input.timezone)}`;
  const html = `
    <p>Programarea ta la <strong>${input.merchantName}</strong> pentru <strong>${input.serviceName}</strong> din ${when} a fost confirmată!</p>
  `.trim();

  const result = await sendEmail(input.clientEmail, "Programarea ta a fost confirmată", html);
  if (!result.success) {
    console.error("[Email] Confirmation email to client failed", { error: result.error });
  }
}
