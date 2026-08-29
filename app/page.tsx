import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/home/hero";
import { MerchantSearch } from "@/components/merchant-search";
import { MerchantCard } from "@/components/merchant-card";
import { Planni } from "@/components/planni";
import { getMerchantFilterOptions, searchMerchants } from "@/lib/data/merchants";
import { getPlatformStats } from "@/lib/data/stats";

interface DiscoverPageProps {
  searchParams: Promise<{ q?: string; category?: string; city?: string }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const [merchants, filterOptions, stats, allMerchants] = await Promise.all([
    searchMerchants({ query: params.q, category: params.category, city: params.city }),
    getMerchantFilterOptions(),
    getPlatformStats(),
    // The hero showcases the whole catalogue regardless of the filters
    // applied to the results below it, so it never empties out mid-search.
    searchMerchants(),
  ]);

  const hasActiveFilters = Boolean(params.q || params.category || params.city);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <Hero
        merchants={allMerchants}
        cities={filterOptions.cities}
        categories={filterOptions.categories}
        stats={stats}
        initialQuery={params.q}
        initialCity={params.city}
      />

      <main id="rezultate" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-12">
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
              <p className="text-sm font-medium text-foreground">
                {hasActiveFilters ? "Niciun rezultat" : "Niciun comerciant momentan"}
              </p>
              <p className="max-w-xs text-sm text-muted-foreground">
                {hasActiveFilters
                  ? "Încearcă alți termeni de căutare sau elimină filtrele active."
                  : "Revino în curând -- adăugăm comercianți noi constant."}
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
      </main>
    </div>
  );
}
