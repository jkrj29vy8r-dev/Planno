"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PlanId } from "@/lib/subscription-plans";

export interface SubscriptionActionState {
  error?: string;
  success?: boolean;
}

/**
 * Activates or renews the merchant's plan.
 *
 * This calls activate_merchant_subscription(), which is the seam a real
 * payment provider plugs into: today it authorises on merchant
 * ownership alone, so it must move behind a verified webhook (or take a
 * payment reference) before it charges anyone. Ownership is enforced
 * inside the function, not here, so a forged merchantId still fails.
 */
export async function activateSubscriptionAction(
  merchantId: string,
  plan: PlanId,
): Promise<SubscriptionActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Trebuie să fii autentificat." };
  }

  const { error } = await supabase.rpc("activate_merchant_subscription", {
    p_merchant_id: merchantId,
    p_plan: plan,
  });

  if (error) {
    return { error: "Nu am putut activa abonamentul. Încearcă din nou." };
  }

  // The whole dashboard is gated on subscription state, so every route
  // under it is stale after a successful activation.
  revalidatePath("/merchant/dashboard", "layout");
  return { success: true };
}

export async function setCancelAtPeriodEndAction(
  merchantId: string,
  cancel: boolean,
): Promise<SubscriptionActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Trebuie să fii autentificat." };
  }

  const { error } = await supabase.rpc("set_subscription_cancel_at_period_end", {
    p_merchant_id: merchantId,
    p_cancel: cancel,
  });

  if (error) {
    return { error: "Nu am putut actualiza abonamentul." };
  }

  revalidatePath("/merchant/dashboard", "layout");
  return { success: true };
}
