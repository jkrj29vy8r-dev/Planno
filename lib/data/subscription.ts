import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { GRACE_PERIOD_DAYS } from "@/lib/subscription-plans";
import type { Tables } from "@/types/database.types";

export type SubscriptionState = "active" | "grace" | "locked";

export interface MerchantSubscriptionAccess {
  state: SubscriptionState;
  /** The open subscription, if any. Null means the merchant never
   *  subscribed -- rendered as the first-time "choose a plan" case. */
  subscription: Tables<"subscriptions"> | null;
  /** End of the grace window; only meaningful while state is "grace". */
  graceEndsAt: Date | null;
  /** Whole days remaining until the next cutoff: expiry while active,
   *  end of grace while in grace. Null when locked. */
  daysLeft: number | null;
}

const DAY_MS = 86_400_000;

/**
 * Cached per request: the dashboard layout gates on this and pages read
 * it again for display, and it must not re-query per consumer.
 *
 * State comes from the merchant_subscription_state() RPC rather than
 * being recomputed here, so the screen a merchant sees can never
 * disagree with the RLS policy that actually blocks their bookings.
 */
export const getMerchantSubscriptionAccess = cache(
  async (merchantId: string): Promise<MerchantSubscriptionAccess> => {
    const supabase = await createClient();

    const [stateResult, subscriptionResult] = await Promise.all([
      supabase.rpc("merchant_subscription_state", { target_merchant_id: merchantId }),
      supabase
        .from("subscriptions")
        .select("*")
        .eq("merchant_id", merchantId)
        .in("status", ["trialing", "active", "past_due"])
        .maybeSingle(),
    ]);

    if (stateResult.error) throw stateResult.error;
    if (subscriptionResult.error) throw subscriptionResult.error;

    const state = (stateResult.data ?? "locked") as SubscriptionState;
    const subscription = subscriptionResult.data;

    if (!subscription) {
      return { state, subscription: null, graceEndsAt: null, daysLeft: null };
    }

    const expiresAt = new Date(subscription.expires_at);
    const graceEndsAt = new Date(expiresAt.getTime() + GRACE_PERIOD_DAYS * DAY_MS);
    const cutoff = state === "active" ? expiresAt : graceEndsAt;
    const daysLeft =
      state === "locked" ? null : Math.max(0, Math.ceil((cutoff.getTime() - Date.now()) / DAY_MS));

    return { state, subscription, graceEndsAt, daysLeft };
  },
);

/** Whether a merchant can currently receive new bookings. Mirrors the
 *  merchant_accepts_bookings() RLS check, for rendering the storefront. */
export async function merchantAcceptsBookings(merchantId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("merchant_accepts_bookings", {
    target_merchant_id: merchantId,
  });
  if (error) throw error;
  return data ?? false;
}
