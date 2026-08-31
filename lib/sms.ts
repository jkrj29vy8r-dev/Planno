const SMS_API_URL = process.env.SMS_API_URL;
const SMS_API_KEY = process.env.SMS_API_KEY;

export interface SendSmsResult {
  success: boolean;
  error?: string;
}

/**
 * No SMS provider is wired up yet -- SMS_API_KEY doesn't exist in this
 * project's environment, and no provider was specified, so this is a
 * generic bearer-token JSON POST (the shape most providers use), not a
 * verified integration with anyone's real API. Swap the URL/payload/
 * auth below for the real provider's contract once one is chosen; until
 * then this fails loudly (logged, never thrown) instead of pretending
 * to send.
 *
 * Never call this directly from a request handler that a user is
 * waiting on -- wrap the call in `after()` (next/server) so a slow or
 * down provider can't delay or fail the booking action it's attached
 * to. Failure here is always non-fatal to the caller by design: it
 * returns a result object, never throws.
 */
export async function sendSms(to: string, message: string): Promise<SendSmsResult> {
  if (!SMS_API_URL || !SMS_API_KEY) {
    console.error("[SMS] Not configured -- set SMS_API_URL and SMS_API_KEY to enable sending.");
    return { success: false, error: "Serviciul SMS nu este configurat." };
  }

  try {
    const response = await fetch(SMS_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SMS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, message }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[SMS] Provider rejected the request", { to, status: response.status, body });
      return { success: false, error: `Provider-ul SMS a răspuns cu statusul ${response.status}.` };
    }

    return { success: true };
  } catch (error) {
    console.error("[SMS] Send failed", { to, error });
    return { success: false, error: "Nu am putut trimite SMS-ul." };
  }
}
