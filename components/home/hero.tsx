import { CalendarCheck, Zap } from "lucide-react";
import { HeroSearch } from "@/components/home/hero-search";
import { HeroShowcase, type ShowcaseCategory } from "@/components/home/hero-showcase";
import { PlanniTip } from "@/components/home/planni-tip";
import { TrustRow } from "@/components/home/trust-row";
import { categoryLabel } from "@/lib/categories";
import type { PlatformStats } from "@/lib/data/stats";
import type { MerchantListItem } from "@/lib/data/merchants";

interface HeroProps {
  merchants: MerchantListItem[];
  cities: string[];
  categories: string[];
  stats: PlatformStats;
  initialQuery?: string;
  initialCity?: string;
}

/** Rolls the live merchant list up into per-category tiles, so the
 *  showcase can only ever link to a filter that returns results. */
function buildShowcase(merchants: MerchantListItem[]): ShowcaseCategory[] {
  const byCategory = new Map<string, ShowcaseCategory>();

  for (const merchant of merchants) {
    const entry = byCategory.get(merchant.category) ?? {
      id: merchant.category,
      merchantCount: 0,
      fromPrice: null,
      currency: "RON",
    };
    entry.merchantCount += 1;

    for (const service of merchant.services) {
      if (entry.fromPrice === null || service.price < entry.fromPrice) {
        entry.fromPrice = service.price;
        entry.currency = service.currency;
      }
    }
    byCategory.set(merchant.category, entry);
  }

  return Array.from(byCategory.values()).sort((a, b) => b.merchantCount - a.merchantCount);
}

function buildTips(merchants: MerchantListItem[], cities: string[]): string[] {
  const tips = ["Salut! Sunt Planni. Spune-mi ce cauți și găsesc orele libere."];

  const featured = merchants[0];
  if (featured) {
    tips.push(`${featured.business_name} are ore libere săptămâna asta — merită o privire.`);
  }
  if (cities[0]) {
    tips.push(`Caută după oraș: ${cities[0]} are cele mai multe afaceri pe Planno.`);
  }
  tips.push("Rezervi în 3 clickuri: alegi serviciul, ora, gata.");

  return tips;
}

export function Hero({ merchants, cities, categories, stats, initialQuery, initialCity }: HeroProps) {
  const showcase = buildShowcase(merchants);
  const tips = buildTips(merchants, cities);
  const topCategories = categories.slice(0, 3).map(categoryLabel).join(", ").toLowerCase();

  return (
    <section className="relative isolate overflow-hidden border-b border-border/40">
      {/* Layered ambience: two wide, low-chroma washes plus a grid that
          dissolves toward the edges. Cheaper than an image, and it never
          fights the foreground for contrast. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-48 size-[38rem] rounded-full bg-accent/[0.13] blur-[110px]" />
        <div className="absolute -right-32 top-16 size-[32rem] rounded-full bg-[#2E6866]/[0.12] blur-[110px]" />
        <div className="absolute inset-0 hero-grid" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pb-24 lg:pt-20">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
            </span>
            {stats.bookingsLast30Days > 0
              ? `${stats.bookingsLast30Days} rezervări în ultimele 30 de zile`
              : "Rezervări online, în timp real"}
          </span>

          <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
            Rezervă orice serviciu local în câteva secunde.
            <span className="mt-2 block text-muted-foreground">Fără telefoane, fără așteptare.</span>
          </h1>

          <p className="max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {topCategories
              ? `Descoperă ${topCategories} și multe altele din orașul tău.`
              : "Descoperă afaceri locale din orașul tău."}{" "}
            Vezi orele libere în timp real și confirmă pe loc — comerciantul primește rezervarea
            instant.
          </p>

          <div className="w-full max-w-2xl pt-1">
            <HeroSearch
              cities={cities}
              categories={categories}
              initialQuery={initialQuery}
              initialCity={initialCity}
            />
          </div>

          <TrustRow names={merchants.map((m) => m.business_name)} stats={stats} className="pt-2" />

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Zap className="size-3.5 text-accent" aria-hidden="true" />
              Confirmare instant
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarCheck className="size-3.5 text-accent" aria-hidden="true" />
              Anulare și reprogramare gratuite
            </span>
          </div>
        </div>

        <div className="relative">
          <HeroShowcase categories={showcase} />

          <div className="mt-6 hidden lg:flex">
            <PlanniTip tips={tips} />
          </div>
        </div>
      </div>
    </section>
  );
}
