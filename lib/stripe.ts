import Stripe from "stripe";

/**
 * Undefined until STRIPE_SECRET_KEY is set (it isn't yet -- no Stripe
 * account is connected to this project). Check `isStripeConfigured()`
 * before using `stripe` directly; every call site in this app already
 * does, falling back to the pre-Stripe manual-activation path instead
 * of throwing when it's unset.
 */
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export function isStripeConfigured(): boolean {
  return stripe !== null;
}
