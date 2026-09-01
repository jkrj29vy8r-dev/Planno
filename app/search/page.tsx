import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { BottomNav } from "@/components/bottom-nav";
import { MerchantSearch } from "@/components/merchant-search";
import { MerchantCard } from "@/components/merchant-card";
import { Planni } from "@/components/planni";
import { getCurrentProfile } from "@/lib/data/auth";
import { getMerchantFilterOptions, searchMerchants } from "@/lib/data/merchants";

export const metadata = { title: "Căutare · Planno" };

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string; city?: string }>;
}

/**
 * The dedicated search destination. Split out from the home page so
 * "Acasă" and "Căutare" are genuinely different routes: while search
 * lived at "/#rezultate", both nav items pointed at the same pathname
 * and the active state could never distinguish them.
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const [merchants, filterOptions, profile] = await Promise.all([
    searchMerchants({ query: params.q, category: params.category, city: params.city }),
    getMerchantFilterOptions(),
    getCurrentProfile(),
  ]);

  const hasActiveFilters = Boolean(params.q || params.category || params.city);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <AnnouncementBanner />
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Căutare</h1>
          <p className="text-muted-foreground">
            {hasActiveFilters
              ? `${merchants.length} ${merchants.length === 1 ? "rezultat" : "rezultate"} pentru filtrele active.`
              : "Caută după serviciu, categorie sau oraș — în București și în orice alt oraș din țară."}
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
      </main>

      <BottomNav isAuthenticated={Boolean(profile)} />
    </div>
  );
}
