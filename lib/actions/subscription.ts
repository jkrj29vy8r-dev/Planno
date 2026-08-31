"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { getPlan, type PlanId } from "@/lib/subscription-plans";

export interface SubscriptionActionState {
  error?: string;
  success?: boolean;
}

export interface CheckoutSessionState {
  error?: string;
  /** Present only when Stripe actually created a session -- the caller
   *  redirects the browser here. Absent when the no-Stripe-configured
   *  fallback below activated the plan directly instead. */
  checkoutUrl?: string;
  /** True when the fallback path ran and the plan is already active --
   *  the caller should just refresh rather than redirect anywhere. */
  activatedDirectly?: boolean;
}

/** Best-effort absolute origin for Stripe's success/cancel redirect --
 *  there's no NEXT_PUBLIC_SITE_URL configured, so this reads it off the
 *  request itself. */
async function resolveOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (origin) return origin;

  const host = requestHeaders.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

/**
 * Creates a real Stripe Checkout session for the chosen plan -- one
 * card payment for the term, not a recurring Stripe subscription
 * object, matching how this app already models renewal (an explicit
 * activate/renew action, not auto-billing). The price is built inline
 * via price_data at session-creation time rather than a pre-created
 * Stripe Price ID, so there's nothing to configure in the Stripe
 * dashboard beyond an account and its API keys.
 *
 * No Stripe account is connected to this project yet (STRIPE_SECRET_KEY
 * is unset), so this currently always takes the fallback branch: it
 * calls activateSubscriptionAction's own RPC directly, exactly what the
 * pricing page did before Checkout existed, so the flow keeps working
 * rather than breaking until real keys are added. Once STRIPE_SECRET_KEY
 * (and STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY for the webhook
 * that confirms payment -- see app/api/webhooks/stripe/route.ts) are
 * set, this starts creating real sessions instead.
 */
export async function createCheckoutSessionAction(
  merchantId: string,
  plan: PlanId,
): Promise<CheckoutSessionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Trebuie să fii autentificat." };
  }

  const { data: merchant, error: merchantError } = await supabase
    .from("merchants")
    .select("business_name")
    .eq("id", merchantId)
    .eq("owner_id", user.id)
    .single();

  if (merchantError || !merchant) {
    return { error: "Nu ai acces la acest abonament." };
  }

  if (!isStripeConfigured() || !stripe) {
    const result = await activateSubscriptionAction(merchantId, plan);
    if (result.error) return { error: result.error };
    return { activatedDirectly: true };
  }

  const planDetails = getPlan(plan);
  const origin = await resolveOrigin();

  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("merchant_id", merchantId)
    .not("stripe_customer_id", "is", null)
    .maybeSingle();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer: existingSubscription?.stripe_customer_id ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: planDetails.currency.toLowerCase(),
            unit_amount: Math.round(planDetails.price * 100),
            product_data: {
              name: `Planno · Abonament ${planDetails.name}`,
              description: `${merchant.business_name} — ${planDetails.cadence}`,
            },
          },
        },
      ],
      metadata: { merchantId, plan },
      success_url: `${origin}/merchant/dashboard/subscription?checkout=success`,
      cancel_url: `${origin}/merchant/dashboard/subscription?checkout=cancelled`,
    });

    if (!session.url) {
      return { error: "Nu am putut porni plata. Încearcă din nou." };
    }

    return { checkoutUrl: session.url };
  } catch (error) {
    console.error("[Stripe] Failed to create checkout session", { merchantId, plan, error });
    return { error: "Nu am putut porni plata. Încearcă din nou." };
  }
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
