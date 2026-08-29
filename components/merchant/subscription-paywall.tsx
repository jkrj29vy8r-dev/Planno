import { CalendarX2, Lock } from "lucide-react";
import { Planni } from "@/components/planni";
import { PricingPlans } from "@/components/merchant/pricing-plans";
import { formatDateLong } from "@/lib/format";
import { GRACE_PERIOD_DAYS } from "@/lib/subscription-plans";
import type { MerchantSubscriptionAccess } from "@/lib/data/subscription";
import type { PlanId } from "@/lib/subscription-plans";

/**
 * Shown in place of the dashboard content once a subscription is past
 * its grace period. The sidebar stays mounted around it, so the panel
 * reads as locked rather than gone.
 */
export function SubscriptionPaywall({
  merchantId,
  access,
}: {
  merchantId: string;
  access: MerchantSubscriptionAccess;
}) {
  const { subscription } = access;
  const neverSubscribed = subscription === null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <Planni state={neverSubscribed ? "welcome" : "error"} size={130} message="" />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {neverSubscribed ? "Alege un plan ca să începi" : "Abonamentul tău a expirat"}
          </h1>
          <p className="mx-auto max-w-md text-[15px] leading-relaxed text-muted-foreground">
            {neverSubscribed ? (
              <>
                Panoul de administrare și rezervările online se activează imediat după alegerea unui
                plan.
              </>
            ) : (
              <>
                A expirat pe{" "}
                <span className="font-medium text-foreground">
                  {formatDateLong(new Date(subscription.expires_at))}
                </span>
                , iar cele {GRACE_PERIOD_DAYS} zile de grație s-au încheiat. Reactivează un plan ca
                să reiei activitatea.
              </>
            )}
          </p>
        </div>
      </div>

      {!neverSubscribed && (
        <div className="mx-auto mb-8 grid max-w-2xl gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/[0.04] p-3.5">
            <CalendarX2 className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Nu mai primești rezervări</p>
              <p className="text-muted-foreground">
                Clienții nu mai pot rezerva la tine până la reactivare.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
            <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Datele tale sunt intacte</p>
              <p className="text-muted-foreground">
                Rezervările, serviciile și clienții te așteaptă neatinse.
              </p>
            </div>
          </div>
        </div>
      )}

      <PricingPlans
        merchantId={merchantId}
        currentPlan={(subscription?.plan as PlanId | undefined) ?? null}
        isRenewal
      />
    </div>
  );
}
