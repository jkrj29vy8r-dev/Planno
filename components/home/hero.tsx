import { Zap } from "lucide-react";
import { HeroSearch } from "@/components/home/hero-search";
import { HeroShowcase, type ShowcaseCategory } from "@/components/home/hero-showcase";
import { PlanniTip } from "@/components/home/planni-tip";
import { TrustRow } from "@/components/home/trust-row";
import { WelcomeToast } from "@/components/home/welcome-toast";
import type { PlatformStats } from "@/lib/data/stats";
import type { MerchantListItem } from "@/lib/data/merchants";

interface HeroProps {
  merchants: MerchantListItem[];
  categories: string[];
  stats: PlatformStats;
  initialQuery?: string;
  initialCity?: string;
}

const TRUST_POINTS = ["Confirmare instantanee", "Fără comision ascuns", "Anulare gratuită"];

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

export function Hero({ merchants, categories, stats, initialQuery, initialCity }: HeroProps) {
  const showcase = buildShowcase(merchants);
  const hasShowcase = showcase.length > 0;

  return (
    <section className="relative isolate overflow-hidden border-b border-border/40">
      <WelcomeToast />

      {/* Layered depth: a spotlight centered behind the search island,
          a hairline grid for texture, and two faint corner washes --
          all quiet enough to never fight the foreground for contrast. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 hero-spotlight" />
        <div className="absolute inset-0 hero-grid" />
        <div className="absolute -left-40 -top-48 size-[34rem] rounded-full bg-accent/[0.08] blur-[120px]" />
        <div className="absolute -right-40 top-24 size-[30rem] rounded-full bg-[#2E6866]/[0.09] blur-[120px]" />
      </div>

      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-16 pt-20 text-center lg:pb-24 lg:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm shadow-black/[0.03] backdrop-blur">
          <Zap className="size-3.5 text-accent" aria-hidden="true" />
          {stats.bookingsLast30Days > 0
            ? `${stats.bookingsLast30Days} rezervări în ultimele 30 de zile`
            : "Platformă de rezervări online în timp real"}
        </span>

        <h1 className="mt-6 max-w-2xl text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-[4rem]">
          Rezervă orice serviciu local în câteva secunde.
          <span className="mt-2 block text-muted-foreground">Fără telefoane, fără așteptare.</span>
        </h1>

        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          Descoperă specialiști și afaceri locale din orașul tău. Vezi orarul în timp real și
          rezervi pe loc în mai puțin de 30 de secunde.
        </p>

        <div className="mt-9 w-full">
          <HeroSearch categories={categories} initialQuery={initialQuery} initialCity={initialCity} />
        </div>

        <div className="mt-5 hidden lg:flex">
          <PlanniTip />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          {TRUST_POINTS.flatMap((point, index) => [
            index > 0 && (
              <span
                key={`sep-${point}`}
                aria-hidden="true"
                className="size-1 rounded-full bg-current opacity-40"
              />
            ),
            <span key={point}>{point}</span>,
          ])}
        </div>
      </div>

      {hasShowcase && (
        <div className="mx-auto max-w-5xl px-6 pb-20 lg:pb-28">
          <h2 className="mb-6 text-xl font-bold tracking-tight text-balance sm:text-2xl">
            Ce vrei să programezi azi?
          </h2>
          <HeroShowcase categories={showcase} />
          <TrustRow
            names={merchants.map((m) => m.business_name)}
            stats={stats}
            className="mt-10 justify-center text-center"
          />
        </div>
      )}
    </section>
  );
}
