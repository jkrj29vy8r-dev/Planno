import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

/** Falls back to Resend's own shared sandbox sender so sending works the
 *  moment RESEND_API_KEY is set, with no domain to configure first --
 *  but that sandbox address can only deliver to the Resend account's
 *  own verified email, never to real clients/merchants. Set EMAIL_FROM
 *  to an address on a domain verified in the Resend dashboard (e.g.
 *  notificari@planno.ro) before this can reach real recipients. */
const EMAIL_FROM = process.env.EMAIL_FROM || "Planno <onboarding@resend.dev>";

export interface SendEmailResult {
  success: boolean;
  error?: string;
}

/**
 * No email provider is wired up yet -- RESEND_API_KEY doesn't exist in
 * this project's environment, so `resend` above is null and every call
 * fails loudly (logged, never thrown) instead of pretending to send.
 *
 * Never call this directly from a request handler a user is waiting
 * on -- wrap the call in `after()` (next/server) so a slow or down
 * provider can't delay or fail the action it's attached to. Failure
 * here is always non-fatal to the caller by design: it returns a
 * result object, never throws.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<SendEmailResult> {
  if (!resend) {
    console.error("[Email] Not configured -- set RESEND_API_KEY to enable sending.");
    return { success: false, error: "Serviciul de email nu este configurat." };
  }

  try {
    const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html });

    if (error) {
      console.error("[Email] Provider rejected the request", { to, error });
      return { success: false, error: `Provider-ul de email a refuzat trimiterea: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Send failed", { to, error });
    return { success: false, error: "Nu am putut trimite email-ul." };
  }
}
