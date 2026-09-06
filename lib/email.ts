const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = "https://api.resend.com/emails";

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
 * this project's environment. Resend was picked over the alternatives
 * (SendGrid, Postmark, SES) for being a single API call with no SDK or
 * account-side template setup required, matching how lib/sms.ts stays
 * provider-thin. Swap the URL/payload/auth below if a different
 * provider is chosen instead; until a key is set this fails loudly
 * (logged, never thrown) rather than pretending to send.
 *
 * Never call this directly from a request handler a user is waiting
 * on -- wrap the call in `after()` (next/server) so a slow or down
 * provider can't delay or fail the action it's attached to. Failure
 * here is always non-fatal to the caller by design: it returns a
 * result object, never throws.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    console.error("[Email] Not configured -- set RESEND_API_KEY to enable sending.");
    return { success: false, error: "Serviciul de email nu este configurat." };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[Email] Provider rejected the request", { to, status: response.status, body });
      return { success: false, error: `Provider-ul de email a răspuns cu statusul ${response.status}.` };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Send failed", { to, error });
    return { success: false, error: "Nu am putut trimite email-ul." };
  }
}
