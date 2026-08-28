import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { MerchantSearch } from "@/components/merchant-search";
import { MerchantCard } from "@/components/merchant-card";
import { Planni } from "@/components/planni";
import { getMerchantFilterOptions, searchMerchants } from "@/lib/data/merchants";

interface DiscoverPageProps {
  searchParams: Promise<{ q?: string; category?: string; city?: string }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const [merchants, filterOptions] = await Promise.all([
    searchMerchants({ query: params.q, category: params.category, city: params.city }),
    getMerchantFilterOptions(),
  ]);

  const hasActiveFilters = Boolean(params.q || params.category || params.city);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Găsește-ți următoarea programare
          </h1>
          <p className="text-muted-foreground">
            Descoperă comercianți din apropiere și rezervă în câteva clickuri.
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
