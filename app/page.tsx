import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { Hero } from "@/components/home/hero";
import { FounderLaunchSection } from "@/components/home/founder-launch-section";
import { PartnerCta } from "@/components/home/partner-cta";
import { ReviewsSection } from "@/components/home/reviews-section";
import { MerchantSearch } from "@/components/merchant-search";
import { MerchantCard } from "@/components/merchant-card";
import { Planni } from "@/components/planni";
import { getCurrentProfile } from "@/lib/data/auth";
import { getMerchantFilterOptions, searchMerchants } from "@/lib/data/merchants";
import { getFeaturedReviews, getRecentReviewerNames } from "@/lib/data/reviews";
import { getPlatformStats } from "@/lib/data/stats";

interface DiscoverPageProps {
  searchParams: Promise<{ q?: string; category?: string; city?: string }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const [merchants, filterOptions, stats, allMerchants, profile, featuredReviews, reviewerNames] = await Promise.all([
    searchMerchants({ query: params.q, category: params.category, city: params.city }),
    getMerchantFilterOptions(),
    getPlatformStats(),
    // The hero showcases the whole catalogue regardless of the filters
    // applied to the results below it, so it never empties out mid-search.
    searchMerchants(),
    getCurrentProfile(),
    getFeaturedReviews(3),
    getRecentReviewerNames(5),
  ]);

  const hasActiveFilters = Boolean(params.q || params.category || params.city);
  // Distinguishes "nothing on the platform yet" from "nothing matches this
  // filter" -- with zero merchants site-wide, every filter combination
  // returns empty, so the filter UI itself has nothing to offer either.
  const platformIsEmpty = allMerchants.length === 0;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <SiteHeader />

      <Hero
        merchants={allMerchants}
        categories={filterOptions.categories}
        stats={stats}
        reviewerNames={reviewerNames}
        initialQuery={params.q}
        initialCity={params.city}
      />

      <ReviewsSection reviews={featuredReviews} />

      <main id="rezultate" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-12">
        {platformIsEmpty ? (
          <FounderLaunchSection />
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-balance">
                {hasActiveFilters ? "Rezultatele căutării" : "Toate afacerile de pe Planno"}
              </h2>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? `${merchants.length} ${merchants.length === 1 ? "rezultat" : "rezultate"} pentru filtrele active.`
                  : "Filtrează după categorie sau oraș și rezervă în câteva clickuri."}
              </p>
            </div>

            <Suspense>
              <MerchantSearch
                filterOptions={filterOptions}
                activeQuery={params.q}
                activeCategory={params.category}
                activeCity={params.city}
              />
            </Suspense>

            {merchants.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <Planni state="empty-state" size={140} message="" />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground">Niciun rezultat</p>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Încearcă alți termeni de căutare sau elimină filtrele active.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {merchants.map((merchant) => (
                  <MerchantCard key={merchant.id} merchant={merchant} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {!platformIsEmpty && <PartnerCta />}

      <BottomNav isAuthenticated={Boolean(profile)} />
    </div>
  );
}
