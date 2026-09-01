import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { BottomNav } from "@/components/bottom-nav";
import { MerchantProfileHero } from "@/components/merchant-profile-hero";
import { MerchantProfileTabs } from "@/components/merchant-profile-tabs";
import { getMerchantBySlug, type MerchantDetail } from "@/lib/data/merchants";
import { getCurrentProfile } from "@/lib/data/auth";
import { merchantAcceptsBookings } from "@/lib/data/subscription";
import { getMerchantReviewSummary, type ReviewSummary } from "@/lib/data/reviews";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.types";

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

  console.log("[Profil Comerciant] Fetching data...", { id: slug });

  let merchant: MerchantDetail | null;
  let profile: Tables<"profiles"> | null;
  try {
    [merchant, profile] = await Promise.all([getMerchantBySlug(slug), getCurrentProfile()]);
  } catch (error) {
    console.error("[Profil Comerciant] Failed to fetch merchant", { id: slug, error });
    throw error;
  }

  if (!merchant) {
    console.warn("[Profil Comerciant] No merchant found for slug", { id: slug });
    notFound();
  }

  const activeServices = merchant.services.filter((service) => service.is_active);

  let acceptsBookings: boolean;
  let reviewSummary: ReviewSummary;
  try {
    // Mirrors the RLS check -- a lapsed merchant's booking insert would
    // be rejected anyway, so the panel is hidden rather than failing on
    // submit.
    [acceptsBookings, reviewSummary] = await Promise.all([
      merchantAcceptsBookings(merchant.id),
      getMerchantReviewSummary(merchant.id),
    ]);
  } catch (error) {
    console.error("[Profil Comerciant] Failed to fetch booking/review state", { id: merchant.id, error });
    throw error;
  }

  // The mobile sticky booking CTA (in MerchantProfileTabs) stacks on top
  // of BottomNav, not beside it -- when both are showing, the page needs
  // room for both fixed bars or the last bit of scrolled content (e.g.
  // the last review) ends up hidden behind them.
  const canBook = acceptsBookings && activeServices.length > 0;

  return (
    <div className={cn("min-h-screen bg-background md:pb-0", canBook ? "pb-40" : "pb-24")}>
      <AnnouncementBanner />
      <SiteHeader />
      <MerchantProfileHero merchant={merchant} />

      <main className="mx-auto max-w-5xl px-6 pt-6">
        <MerchantProfileTabs
          merchant={merchant}
          services={activeServices}
          profile={profile}
          acceptsBookings={acceptsBookings}
          reviewSummary={reviewSummary}
        />
      </main>

      <BottomNav isAuthenticated={Boolean(profile)} />
    </div>
  );
}
