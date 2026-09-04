import { AnnouncementBanner } from "@/components/announcement-banner";
import { BottomNav } from "@/components/bottom-nav";
import { FounderLaunchSection } from "@/components/home/founder-launch-section";
import { Landing } from "@/components/home/landing";
import { ReviewsSection } from "@/components/home/reviews-section";
import { getCurrentProfile } from "@/lib/data/auth";
import { getMerchantFilterOptions, searchMerchants } from "@/lib/data/merchants";
import { getFeaturedReviews } from "@/lib/data/reviews";
import { getPlatformStats } from "@/lib/data/stats";

interface DiscoverPageProps {
  searchParams: Promise<{ q?: string; city?: string }>;
}

/**
 * The v0 landing design (header, hero + search, categories, partners,
 * business CTA, footer), rendered from real data. Merchant browsing with
 * the full filter UI lives at /search, not duplicated here.
 */
export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const [filterOptions, stats, allMerchants, profile, featuredReviews] = await Promise.all([
    getMerchantFilterOptions(),
    getPlatformStats(),
    searchMerchants(),
    getCurrentProfile(),
    getFeaturedReviews(3),
  ]);

  // Only true before the first merchant signs up -- the categories and
  // partners grids are both empty then, so this is the one real thing
  // left to show instead of a bare page.
  const platformIsEmpty = allMerchants.length === 0;

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <AnnouncementBanner />

      <Landing
        merchants={allMerchants}
        filterOptions={filterOptions}
        stats={stats}
        profile={profile}
        initialQuery={params.q}
        initialCity={params.city}
      >
        {platformIsEmpty ? (
          <section className="mx-auto mt-20 max-w-7xl px-5 sm:px-8">
            <FounderLaunchSection />
          </section>
        ) : (
          <ReviewsSection reviews={featuredReviews} />
        )}
      </Landing>

      <BottomNav isAuthenticated={Boolean(profile)} />
    </div>
  );
}
