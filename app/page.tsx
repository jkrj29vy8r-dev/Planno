import { AnnouncementBanner } from "@/components/announcement-banner";
import { BottomNav } from "@/components/bottom-nav";
import { DiscoverHero } from "@/components/home/discover-hero";
import { FounderLaunchSection } from "@/components/home/founder-launch-section";
import { PartnerCta } from "@/components/home/partner-cta";
import { ReviewsSection } from "@/components/home/reviews-section";
import { getCurrentProfile } from "@/lib/data/auth";
import { getMerchantFilterOptions, searchMerchants } from "@/lib/data/merchants";
import { getFeaturedReviews, getRecentReviewerNames } from "@/lib/data/reviews";
import { getPlatformStats } from "@/lib/data/stats";

interface DiscoverPageProps {
  searchParams: Promise<{ q?: string; city?: string }>;
}

/**
 * The v0 redesign's discovery section (header, hero, search, category
 * grid) is the entire homepage now -- actual merchant search/browse
 * results live at /search (its own route, with the full filter UI),
 * not duplicated here too.
 */
export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const [filterOptions, stats, allMerchants, profile, featuredReviews, reviewerNames] = await Promise.all([
    getMerchantFilterOptions(),
    getPlatformStats(),
    searchMerchants(),
    getCurrentProfile(),
    getFeaturedReviews(3),
    getRecentReviewerNames(5),
  ]);

  // Only true before the first merchant ever signs up -- the category
  // grid above is already empty in that case too, so this is the one
  // real thing left to show instead of a blank page.
  const platformIsEmpty = allMerchants.length === 0;

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <AnnouncementBanner />

      <DiscoverHero
        merchants={allMerchants}
        filterOptions={filterOptions}
        stats={stats}
        reviewerNames={reviewerNames}
        profile={profile}
        initialQuery={params.q}
        initialCity={params.city}
      />

      <ReviewsSection reviews={featuredReviews} />

      {platformIsEmpty ? (
        <main className="mx-auto max-w-6xl px-6 py-12">
          <FounderLaunchSection />
        </main>
      ) : (
        <PartnerCta />
      )}

      <BottomNav isAuthenticated={Boolean(profile)} />
    </div>
  );
}
