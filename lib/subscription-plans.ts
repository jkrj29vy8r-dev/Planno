// Plan catalogue. Boundary-free (no "use client", no server imports) so
// the pricing UI, the paywall and server code can all read the same
// numbers -- prices must never be duplicated per surface.

export type PlanId = "monthly" | "quarterly" | "annual";

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  /** Total charged once per term, in RON. */
  price: number;
  currency: string;
  /** Term length, used to derive the per-month equivalent. */
  months: number;
  /** How the term reads in the price line, e.g. "99 RON / lună". */
  cadence: string;
  tagline: string;
  badge?: string;
  highlight?: boolean;
}

/** Reference price a term is compared against when showing savings. */
export const MONTHLY_BASE_PRICE = 99;

/** Must match subscription_grace_period() in the database, which is what
 *  actually enforces the cutoff on writes. */
export const GRACE_PERIOD_DAYS = 3;

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "monthly",
    name: "Lunar",
    price: 99,
    currency: "RON",
    months: 1,
    cadence: "lună",
    tagline: "Flexibil, fără angajament. Anulezi oricând.",
  },
  {
    id: "quarterly",
    name: "Trimestrial",
    price: 249,
    currency: "RON",
    months: 3,
    cadence: "3 luni",
    tagline: "Același Planno, la un preț lunar mai mic.",
    badge: "Economisești 16%",
  },
  {
    id: "annual",
    name: "Anual",
    price: 899,
    currency: "RON",
    months: 12,
    cadence: "an",
    tagline: "Economisești 25% față de plata lunară.",
    badge: "Best Value",
    highlight: true,
  },
];

/** Everything is included on every plan -- the plans differ only in
 *  billing cadence and price, so the feature list is shared. */
export const PLAN_FEATURES = [
  "Rezervări online nelimitate",
  "Calendar cu vederi pe zi, săptămână și lună",
  "Servicii și program de lucru nelimitate",
  "Listă de clienți și istoric rezervări",
  "Pagină publică proprie pe Planno",
];

export function getPlan(id: PlanId): SubscriptionPlan {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

/** Per-month cost of a term, for the "≈ 83 RON / lună" line. */
export function monthlyEquivalent(plan: SubscriptionPlan): number {
  return plan.price / plan.months;
}

/** Absolute saving against paying monthly for the same span. */
export function savingsVsMonthly(plan: SubscriptionPlan): number {
  return MONTHLY_BASE_PRICE * plan.months - plan.price;
}

export function savingsPercent(plan: SubscriptionPlan): number {
  const full = MONTHLY_BASE_PRICE * plan.months;
  return full === 0 ? 0 : Math.round((savingsVsMonthly(plan) / full) * 100);
}

/** How many free months an annual-style term effectively includes. */
export function freeMonths(plan: SubscriptionPlan): number {
  return Math.round(savingsVsMonthly(plan) / MONTHLY_BASE_PRICE);
}
