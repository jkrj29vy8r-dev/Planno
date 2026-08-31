import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role client: bypasses RLS entirely. Only for genuinely
 * trusted server contexts with no user session to scope a request to
 * -- today that's exactly one caller, the Stripe webhook handler
 * (app/api/webhooks/stripe/route.ts), which has no cookies/auth.uid()
 * to run the normal cookie-based client (lib/supabase/server.ts) as.
 * Never import this into anything a request from the browser can
 * reach.
 *
 * Undefined until SUPABASE_SERVICE_ROLE_KEY is set (it isn't yet).
 * Callers must check for null and fail loudly rather than silently
 * skip -- unlike SMS or Stripe, there's no safe "degrade to a no-op"
 * behavior for a webhook that Stripe expects a real response from.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
