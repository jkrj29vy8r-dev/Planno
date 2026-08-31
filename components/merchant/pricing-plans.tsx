"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { createCheckoutSessionAction } from "@/lib/actions/subscription";
import {
  PLAN_FEATURES,
  SUBSCRIPTION_PLANS,
  monthlyEquivalent,
  savingsVsMonthly,
  type PlanId,
} from "@/lib/subscription-plans";

interface PricingPlansProps {
  merchantId: string;
  /** Plan currently held, so its card reads "Planul tău" instead of a
   *  buy button when the subscription is still healthy. */
  currentPlan?: PlanId | null;
  /** A lapsed merchant is renewing, not switching -- every card gets an
   *  actionable button even for the plan they already had. */
  isRenewal?: boolean;
}

export function PricingPlans({ merchantId, currentPlan, isRenewal = false }: PricingPlansProps) {
  const router = useRouter();
  const [pendingPlan, setPendingPlan] = React.useState<PlanId | null>(null);
  const [error, setError] = React.useState("");

  async function handleSelect(plan: PlanId) {
    setPendingPlan(plan);
    setError("");
    const result = await createCheckoutSessionAction(merchantId, plan);

    if (result.error) {
      setPendingPlan(null);
      setError(result.error);
      return;
    }

    if (result.checkoutUrl) {
      // Leaving the page for Stripe -- keep the button's loading state
      // through the redirect instead of resetting it.
      window.location.href = result.checkoutUrl;
      return;
    }

    // No Stripe account connected yet: activated directly, same as
    // before Checkout existed.
    setPendingPlan(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = !isRenewal && currentPlan === plan.id;
          const saving = savingsVsMonthly(plan);

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-xl border bg-card p-6",
                plan.highlight ? "border-accent shadow-md shadow-accent/5" : "border-border/40",
              )}
            >
              {plan.badge && (
                <span
                  className={cn(
                    "absolute -top-2.5 left-6 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    plan.highlight
                      ? "bg-accent text-accent-foreground"
                      : "border border-border/60 bg-card text-muted-foreground",
                  )}
                >
                  {plan.highlight && <Sparkles className="size-3" />}
                  {plan.badge}
                </span>
              )}

              <div className="mb-4">
                <p className="text-sm font-medium">{plan.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{plan.tagline}</p>
              </div>

              <div className="mb-1 flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-semibold tracking-tight">
                  {formatPrice(plan.price, plan.currency)}
                </span>
                <span className="text-sm text-muted-foreground">/ {plan.cadence}</span>
              </div>

              <p className="mb-5 text-xs text-muted-foreground">
                {plan.months > 1
                  ? `≈ ${formatPrice(Math.round(monthlyEquivalent(plan)), plan.currency)} pe lună · economisești ${formatPrice(saving, plan.currency)}`
                  : "Facturat lunar"}
              </p>

              <ul className="mb-6 flex flex-1 flex-col gap-2">
                {PLAN_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="secondary" className="w-full" disabled>
                  Planul tău
                </Button>
              ) : (
                <Button
                  variant={plan.highlight ? "primary" : "outline"}
                  className="w-full"
                  isLoading={pendingPlan === plan.id}
                  disabled={pendingPlan !== null}
                  onClick={() => handleSelect(plan.id)}
                >
                  {isRenewal ? "Reactivează" : currentPlan ? "Schimbă pe acest plan" : "Alege planul"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">
        Prețurile includ TVA. Poți schimba sau anula planul oricând din această pagină.
      </p>
    </div>
  );
}
