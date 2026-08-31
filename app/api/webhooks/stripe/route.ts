import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { PlanId } from "@/lib/subscription-plans";

/**
 * Where a real Stripe payment actually activates a subscription --
 * createCheckoutSessionAction only starts the payment, it never
 * activates anything itself. Needs the raw request body (request.text(),
 * not .json()) because Stripe's signature is computed over the exact
 * bytes it sent; parsing and re-serializing would invalidate it.
 *
 * Not reachable end-to-end in this environment: nothing has called this
 * with a real Stripe-signed payload, since there's no Stripe account
 * connected and this sandbox can't reach Stripe's API regardless. The
 * signature verification, event handling and DB call are written
 * against Stripe's documented webhook contract, not exercised against
 * a live account.
 */
export async function POST(request: Request) {
  if (!stripe) {
    console.error("[Stripe webhook] Received an event but STRIPE_SECRET_KEY is unset.");
    return NextResponse.json({ error: "Stripe not configured." }, { status: 500 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    console.error("[Stripe webhook] Missing STRIPE_WEBHOOK_SECRET or stripe-signature header.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[Stripe webhook] Signature verification failed", { error });
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const merchantId = session.metadata?.merchantId;
    const plan = session.metadata?.plan as PlanId | undefined;

    if (!merchantId || !plan) {
      console.error("[Stripe webhook] checkout.session.completed missing merchantId/plan metadata", {
        sessionId: session.id,
      });
      return NextResponse.json({ received: true });
    }

    const supabase = createServiceRoleClient();
    if (!supabase) {
      console.error("[Stripe webhook] SUPABASE_SERVICE_ROLE_KEY is unset -- cannot activate subscription.", {
        merchantId,
        plan,
        sessionId: session.id,
      });
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { error } = await supabase.rpc("activate_merchant_subscription_from_stripe", {
      p_merchant_id: merchantId,
      p_plan: plan,
      ...(typeof session.customer === "string" ? { p_stripe_customer_id: session.customer } : {}),
      // mode: "payment" sessions never carry a subscription object --
      // this is a one-time charge per term, not Stripe-managed
      // recurring billing -- so p_stripe_subscription_id is omitted
      // and keeps its SQL-side default of null.
    });

    if (error) {
      console.error("[Stripe webhook] activate_merchant_subscription_from_stripe failed", {
        merchantId,
        plan,
        error,
      });
      return NextResponse.json({ error: "Failed to activate subscription." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
