import { getCurrentProfile } from "@/lib/data/auth";
import { getOwnedMerchant } from "@/lib/data/merchant";
import { getMerchantSubscriptionAccess } from "@/lib/data/subscription";
import { SubscriptionSettings } from "@/components/merchant/subscription-settings";
import { PricingPlans } from "@/components/merchant/pricing-plans";
import type { PlanId } from "@/lib/subscription-plans";

export const metadata = { title: "Abonament · Planno" };

export default async function MerchantSubscriptionPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const merchant = await getOwnedMerchant(profile.id);
  if (!merchant) return null;

  const access = await getMerchantSubscriptionAccess(merchant.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Abonament</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Gestionează planul Planno pentru {merchant.business_name}.
        </p>
      </div>

      <SubscriptionSettings merchantId={merchant.id} access={access} />

      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            {access.subscription ? "Schimbă planul" : "Alege un plan"}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Toate planurile includ aceleași funcții — diferă doar cât de des plătești.
          </p>
        </div>

        <PricingPlans
          merchantId={merchant.id}
          currentPlan={(access.subscription?.plan as PlanId | undefined) ?? null}
        />
      </div>
    </div>
  );
}
