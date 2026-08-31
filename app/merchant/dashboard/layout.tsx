import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/data/auth";
import { getOwnedMerchant } from "@/lib/data/merchant";
import { getMerchantSubscriptionAccess } from "@/lib/data/subscription";
import { MerchantSidebar } from "@/components/merchant/merchant-sidebar";
import { SubscriptionBanner } from "@/components/merchant/subscription-banner";
import { SubscriptionPaywall } from "@/components/merchant/subscription-paywall";
import { CreateBusinessForm } from "@/components/merchant/create-business-form";
import { Planni } from "@/components/planni";
import { buttonVariants } from "@/lib/button-variants";

export default async function MerchantDashboardLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/merchant/dashboard");
  if (profile.role !== "merchant" && profile.role !== "admin") redirect("/");

  const merchant = await getOwnedMerchant(profile.id);
  if (!merchant) {
    return (
      <div className="flex min-h-screen flex-col items-center gap-8 bg-background px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <Planni state="welcome" size={120} message="" />
          <div className="space-y-1.5">
            <p className="text-lg font-medium text-foreground">Creează-ți afacerea pe Planno</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Contul tău are rol de comerciant. Completează câteva detalii ca să apari pe Planno și
              clienții să poată rezerva la tine.
            </p>
          </div>
        </div>

        <CreateBusinessForm />

        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Înapoi la Planno
        </Link>
      </div>
    );
  }

  // Gating lives in the layout so it covers every route beneath it --
  // a new dashboard page can't accidentally ship unprotected. The
  // database enforces the same rule on writes; this is the UI half.
  const access = await getMerchantSubscriptionAccess(merchant.id);
  const isLocked = access.state === "locked";

  return (
    <div className="flex min-h-screen bg-background">
      <MerchantSidebar businessName={merchant.business_name} locked={isLocked} />
      <main className="min-w-0 flex-1">
        {isLocked ? (
          <SubscriptionPaywall merchantId={merchant.id} access={access} />
        ) : (
          <>
            <SubscriptionBanner access={access} />
            {children}
          </>
        )}
      </main>
    </div>
  );
}
