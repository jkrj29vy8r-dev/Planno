import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/data/auth";
import { getOwnedMerchant } from "@/lib/data/merchant";
import { MerchantSidebar } from "@/components/merchant/merchant-sidebar";
import { Planni } from "@/components/planni";
import { buttonVariants } from "@/components/ui/button";

export default async function MerchantDashboardLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/merchant/dashboard");
  if (profile.role !== "merchant" && profile.role !== "admin") redirect("/");

  const merchant = await getOwnedMerchant(profile.id);
  if (!merchant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Planni state="empty-state" size={150} message="" />
        <div className="space-y-1.5">
          <p className="text-lg font-medium text-foreground">Nu ai încă o afacere înregistrată</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Contul tău are rol de comerciant, dar nu are nicio afacere asociată încă pe Planno.
          </p>
        </div>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Înapoi la Planno
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <MerchantSidebar businessName={merchant.business_name} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
