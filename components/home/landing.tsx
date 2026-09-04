"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Search, Star } from "lucide-react";
import { CategoryIllustration } from "@/components/category-illustration";
import { Planni } from "@/components/planni";
import { categoryLabel } from "@/lib/categories";
import { categoryVisual } from "@/lib/category-visuals";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MerchantFilterOptions, MerchantListItem } from "@/lib/data/merchants";
import type { PlatformStats } from "@/lib/data/stats";
import type { Tables } from "@/types/database.types";

interface LandingProps {
  merchants: MerchantListItem[];
  filterOptions: MerchantFilterOptions;
  stats: PlatformStats;
  profile: Tables<"profiles"> | null;
  initialQuery?: string;
  initialCity?: string;
  /** Slot for ReviewsSection, so it stays a Server Component rendered
   *  on the server and simply passed through this client boundary. */
  children?: React.ReactNode;
}

const SEARCH_PROMPTS = [
  "un salon în apropiere",
  "un teren de sport pentru azi",
  "un serviciu auto de încredere",
];

const PROMPT_CYCLE_MS = 2600;
const PARTNER_LIMIT = 6;

/** Every real, browsable category ("altele" is a merchant-classification
 *  catch-all, not something to showcase as its own tile), in a fixed
 *  display order -- shown always, not just once a merchant exists in
 *  it, so the grid reads as the platform's full breadth from day one
 *  instead of shrinking to whatever happens to have listings yet. */
const LANDING_CATEGORY_IDS = ["salon", "barbershop", "spa", "fitness", "wellness", "padel", "auto", "transport"];

const CATEGORY_TAGLINES: Record<string, string> = {
  salon: "Relaxare & înfrumusețare",
  barbershop: "Tuns & bărbierit clasic",
  spa: "Masaj & tratamente relaxante",
  fitness: "Antrenamente & clase",
  wellness: "Terapii & recuperare",
  padel: "Terenuri & partide",
  auto: "Servicii auto",
  transport: "Curse & transport local",
};

function buildSearchHref(query: string, city: string): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (city) params.set("city", city);
  return params.size > 0 ? `/search?${params.toString()}` : "/search";
}

/** Teal status pill from the v0 prototype. */
function Status({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-[#56a9a5]/15 px-2.5 py-1 text-[11px] font-semibold text-[#75c8c1]">
      {children}
    </span>
  );
}

export function Landing({
  merchants,
  filterOptions,
  stats,
  profile,
  initialQuery,
  initialCity,
  children,
}: LandingProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQuery ?? "");
  const [city, setCity] = React.useState(initialCity ?? "");
  const [promptIndex, setPromptIndex] = React.useState(0);
  const [planiOpen, setPlaniOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const timer = setInterval(
      () => setPromptIndex((index) => (index + 1) % SEARCH_PROMPTS.length),
      PROMPT_CYCLE_MS,
    );
    return () => clearInterval(timer);
  }, []);

  const inCity = React.useMemo(
    () => (city ? merchants.filter((merchant) => merchant.city === city) : merchants),
    [merchants, city],
  );

  const term = query.trim().toLowerCase();

  const categories = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const merchant of inCity) {
      counts.set(merchant.category, (counts.get(merchant.category) ?? 0) + 1);
    }
    const tiles = LANDING_CATEGORY_IDS.map((id) => ({ id, count: counts.get(id) ?? 0 }));
    if (!term) return tiles;
    // Matches the slug too: Romanian labels pluralize irregularly
    // (salon -> Saloane), so "salon" would miss on the label alone.
    return tiles.filter(
      (tile) => categoryLabel(tile.id).toLowerCase().includes(term) || tile.id.toLowerCase().includes(term),
    );
  }, [inCity, term]);

  const partners = React.useMemo(() => {
    const matches = inCity.filter((merchant) => {
      if (!term) return true;
      return (
        merchant.business_name.toLowerCase().includes(term) ||
        Boolean(merchant.description?.toLowerCase().includes(term)) ||
        categoryLabel(merchant.category).toLowerCase().includes(term) ||
        merchant.category.toLowerCase().includes(term)
      );
    });
    return matches.slice(0, PARTNER_LIMIT);
  }, [inCity, term]);

  const searchHref = React.useMemo(() => buildSearchHref(query, city), [query, city]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(() => router.push(searchHref));
  }

  return (
    <>
      <div className="pb-12">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="text-[1.05rem] font-medium lowercase tracking-[-0.08em] transition-opacity hover:opacity-70 active:scale-[0.98]"
          >
            planno
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#exploreaza" className="transition-colors hover:text-foreground">
              Explorează
            </a>
            <a href="#parteneri" className="transition-colors hover:text-foreground">
              Parteneri
            </a>
            <Link href="/signup?role=merchant" className="transition-colors hover:text-accent">
              Pentru business
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={profile ? "/account" : "/login"}
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Contul meu
            </Link>
            <Link
              href={profile ? "/merchant/dashboard" : "/login?redirect=/merchant/dashboard"}
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Intră în spațiu
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 pb-20 pt-14 sm:px-8 sm:pt-24">
          <div className="max-w-3xl">
            <Status>Experiențe &amp; rezervări simple</Status>

            <h1 className="mt-6 max-w-2xl text-balance text-5xl font-semibold tracking-[-0.07em] sm:text-7xl">
              Cât ai zice <span className="text-accent">Planno.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Locul tău pe sport, îngrijire, mobilitate și servicii, la frizerie, salon sau transport — rezervat
              în câteva secunde, fără apeluri.
            </p>

            <form
              onSubmit={handleSubmit}
              aria-label="Caută și filtrează"
              className="mt-9 flex max-w-2xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-2xl sm:flex-row sm:items-center"
            >
              <Search className="mx-3 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Caută ${SEARCH_PROMPTS[promptIndex]}`}
                aria-label="Caută servicii"
                className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
              <label className="sr-only" htmlFor="landing-city">
                Alege orașul
              </label>
              <select
                id="landing-city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="rounded-xl bg-input px-3 py-3 text-sm outline-none"
              >
                <option value="">Toate orașele</option>
                {filterOptions.cities.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
              >
                {isPending ? "Se caută..." : "Caută"}
              </button>
            </form>

            <p className="mt-3 text-xs text-muted-foreground">
              {stats.bookingsLast30Days > 0
                ? `${stats.bookingsLast30Days} rezervări în ultimele 30 de zile în ${city || "toate orașele"}.`
                : `Rezervări rapide în ${city || "orașul tău"}, fără stres.`}
            </p>
          </div>
        </section>

        <section id="exploreaza" className="mx-auto max-w-7xl scroll-mt-8 px-5 sm:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Descoperă</p>
              <h2 className="text-2xl font-semibold">Categorii populare</h2>
            </div>
            {term && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="shrink-0 text-xs text-muted-foreground underline transition-colors hover:text-foreground"
              >
                Vezi toate
              </button>
            )}
          </div>

          {categories.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nu am găsit încă această categorie.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((tile) => {
                const visual = categoryVisual(tile.id);
                return (
                  <Link
                    key={tile.id}
                    href={`/search?category=${tile.id}`}
                    className="group relative block h-44 overflow-hidden rounded-2xl border border-border text-left transition-colors hover:border-[#56a9a5]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {visual.photo ? (
                      <Image
                        src={visual.photo}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <CategoryIllustration
                        category={tile.id}
                        className="transition-transform duration-500 group-hover:scale-105"
                      />
                    )}

                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                    <div className="absolute inset-x-4 bottom-4">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b9d9e8]">
                        {tile.count > 0 ? (CATEGORY_TAGLINES[tile.id] ?? categoryLabel(tile.id)) : "În curând"}
                      </span>
                      <h3 className="mt-1 text-xl font-semibold text-white">{categoryLabel(tile.id)}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {partners.length > 0 && (
          <section id="parteneri" className="mx-auto mt-20 max-w-7xl scroll-mt-8 px-5 sm:px-8">
            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Aproape de tine</p>
              <h2 className="text-2xl font-semibold">Alege și rezervă direct</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {partners.map((merchant) => {
                const prices = merchant.services.map((service) => service.price);
                const fromPrice = prices.length > 0 ? Math.min(...prices) : null;
                const currency = merchant.services[0]?.currency ?? "RON";
                const hasRating = merchant.rating !== null && merchant.rating_count > 0;

                return (
                  <Link
                    key={merchant.id}
                    href={`/merchants/${merchant.slug}`}
                    className={cn(
                      "group block overflow-hidden rounded-2xl border border-border bg-card",
                      "transition-all duration-300 hover:-translate-y-0.5 hover:border-[#56a9a5]/40",
                      "hover:shadow-lg hover:shadow-[#56a9a5]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <div className="relative h-40 overflow-hidden">
                      {merchant.cover_image_url ? (
                        <Image
                          src={merchant.cover_image_url}
                          alt=""
                          fill
                          sizes="(min-width: 768px) 33vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <CategoryIllustration
                          category={merchant.category}
                          className="transition-transform duration-500 group-hover:scale-105"
                        />
                      )}

                      {hasRating && (
                        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                          <Star className="mr-1 inline size-3 fill-accent text-accent" aria-hidden="true" />
                          {merchant.rating!.toFixed(1).replace(".", ",")}
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="truncate font-semibold">{merchant.business_name}</h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{categoryLabel(merchant.category)}</p>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                        {merchant.city ? (
                          <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">{merchant.city}</span>
                          </span>
                        ) : (
                          <span />
                        )}
                        {fromPrice !== null && (
                          <span className="shrink-0 text-xs font-semibold text-foreground">
                            de la {formatPrice(fromPrice, currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {children}

        <section className="mx-5 mt-20 rounded-3xl border border-[#56a9a5]/25 bg-[#56a9a5]/10 p-7 sm:mx-8 sm:p-10">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#75c8c1]">Pentru business</span>
              <h2 className="mt-3 text-2xl font-semibold">Ai un loc bun? Fă-l ușor de rezervat.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Îți umpli agenda, gestionezi clienții și vezi încasările într-un singur loc.
              </p>
            </div>
            <Link
              href="/signup?role=merchant"
              className="shrink-0 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Vezi spațiul comerciantului
              <ArrowRight className="ml-1 inline size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <footer className="mx-auto mt-20 flex max-w-7xl items-center justify-between border-t border-border px-5 py-8 text-xs text-muted-foreground sm:px-8">
          <span>© {new Date().getFullYear()} PLANNO</span>
          <Link href="/search" className="transition-colors hover:text-foreground">
            Caută
          </Link>
        </footer>
      </div>

      {/* Plani, desktop only: on mobile the floating BottomNav pill already
          owns the bottom of the viewport and the two would overlap. */}
      <div className="hidden md:block">
        <button
          type="button"
          onClick={() => setPlaniOpen((open) => !open)}
          aria-expanded={planiOpen}
          aria-label={planiOpen ? "Închide Plani" : "Deschide Plani"}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full border border-[#56a9a5]/40 bg-card px-3 py-3 shadow-2xl shadow-[#56a9a5]/20 transition-all duration-300 hover:-translate-y-1 hover:border-[#75c8c1] active:scale-[0.98] animate-[pulse_4s_ease-in-out_infinite]"
        >
          <Planni state="welcome" size={40} message="" />
          <span className="pr-2 text-sm font-semibold">Descoperă cu Plani</span>
        </button>

        <div
          className={cn(
            "fixed inset-x-4 bottom-24 z-30 mx-auto max-w-md origin-bottom rounded-3xl border border-[#56a9a5]/30 bg-card p-5 shadow-2xl shadow-black/40 transition-all duration-500",
            planiOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#75c8c1]">Plani recomandă</p>
              <h2 className="mt-2 text-lg font-semibold">Găsește ceva bun pentru azi</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {stats.merchants > 0
                  ? `${stats.merchants} ${stats.merchants === 1 ? "afacere activă" : "afaceri active"}${
                      stats.cities > 0 ? ` în ${stats.cities} ${stats.cities === 1 ? "oraș" : "orașe"}` : ""
                    }. Spune-ne ce cauți și te ducem direct la rezervare.`
                  : "Spune-ne ce cauți și îți arătăm locuri potrivite în orașul, comuna sau localitatea ta."}
              </p>
            </div>
            <Planni state="welcome" size={56} message="" />
          </div>
          <Link
            href={searchHref}
            onClick={() => setPlaniOpen(false)}
            className="mt-5 block w-full rounded-xl bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Începe căutarea
          </Link>
        </div>
      </div>
    </>
  );
}
