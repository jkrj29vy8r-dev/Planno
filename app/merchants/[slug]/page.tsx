import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { BookingPanel } from "@/components/booking-panel";
import { Planni } from "@/components/planni";
import { getMerchantBySlug } from "@/lib/data/merchants";
import { getCurrentProfile } from "@/lib/data/auth";
import { categoryLabel } from "@/components/merchant-search";

interface MerchantPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: MerchantPageProps): Promise<Metadata> {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);
  return { title: merchant ? `${merchant.business_name} · Planno` : "Comerciant negăsit · Planno" };
}

export default async function MerchantPage({ params }: MerchantPageProps) {
  const { slug } = await params;
  const [merchant, profile] = await Promise.all([getMerchantBySlug(slug), getCurrentProfile()]);

  if (!merchant) notFound();

  const activeServices = merchant.services.filter((service) => service.is_active);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10 flex flex-col gap-2">
          <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {categoryLabel(merchant.category)}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">{merchant.business_name}</h1>
          {merchant.city && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {merchant.address ? `${merchant.address}, ` : ""}
              {merchant.city}
            </span>
          )}
          {merchant.description && (
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {merchant.description}
            </p>
          )}
        </div>

        {activeServices.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border/40 bg-card py-16 text-center">
            <Planni state="empty-state" size={128} message="" />
            <div>
              <p className="text-sm font-medium">Niciun serviciu disponibil momentan</p>
              <p className="text-sm text-muted-foreground">
                Acest comerciant nu are servicii active de rezervat.
              </p>
            </div>
          </div>
        ) : (
          <BookingPanel merchant={merchant} services={activeServices} isAuthenticated={Boolean(profile)} />
        )}
      </main>
    </div>
  );
}
