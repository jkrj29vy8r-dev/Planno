"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDateLong, formatPrice } from "@/lib/format";
import { setCancelAtPeriodEndAction } from "@/lib/actions/subscription";
import { getPlan, type PlanId } from "@/lib/subscription-plans";
import type { MerchantSubscriptionAccess } from "@/lib/data/subscription";

/** Current-plan summary + cancel/resume, above the plan picker. */
export function SubscriptionSettings({
  merchantId,
  access,
}: {
  merchantId: string;
  access: MerchantSubscriptionAccess;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState("");

  const { subscription, state, daysLeft } = access;
  if (!subscription) return null;

  const plan = getPlan(subscription.plan as PlanId);
  const willCancel = subscription.cancel_at_period_end;

  async function toggleCancel() {
    setPending(true);
    setError("");
    const result = await setCancelAtPeriodEndAction(merchantId, !willCancel);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">Planul {plan.name}</p>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  state === "active"
                    ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                    : "bg-destructive/12 text-destructive",
                )}
              >
                {state === "active" ? "Activ" : "În perioadă de grație"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatPrice(subscription.price, subscription.currency)} / {plan.cadence}
            </p>
          </div>

          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-sm font-medium">
              <CalendarClock className="size-4 text-muted-foreground" />
              {willCancel ? "Se încheie pe" : "Se reînnoiește pe"}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDateLong(new Date(subscription.expires_at))}
              {daysLeft !== null && state === "active" && ` · în ${daysLeft} zile`}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5",
            willCancel ? "border-destructive/30 bg-destructive/[0.04]" : "border-border/50 bg-muted/30",
          )}
        >
          <p className="flex items-start gap-2 text-sm">
            {willCancel ? (
              <RotateCcw className="mt-0.5 size-4 shrink-0 text-destructive" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">
              {willCancel
                ? "Anularea e programată. Păstrezi accesul până la finalul perioadei plătite."
                : "Reînnoire automată activă la finalul fiecărei perioade."}
            </span>
          </p>
          <Button variant={willCancel ? "primary" : "ghost"} size="sm" isLoading={pending} onClick={toggleCancel}>
            {willCancel ? "Reactivează reînnoirea" : "Anulează reînnoirea"}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
