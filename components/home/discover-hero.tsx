"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleUserRound, ChevronDown, Search, Star } from "lucide-react";
import { AccountMenu } from "@/components/account-menu";
import { DesktopNavLinks } from "@/components/desktop-nav-links";
import { avatarGradient, initials } from "@/lib/avatar";
import { categoryLabel } from "@/lib/categories";
import { categoryVisual } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";
import type { MerchantListItem, MerchantFilterOptions } from "@/lib/data/merchants";
import type { PlatformStats } from "@/lib/data/stats";
import type { Tables } from "@/types/database.types";

interface DiscoverHeroProps {
  merchants: MerchantListItem[];
  filterOptions: MerchantFilterOptions;
  stats: PlatformStats;
  reviewerNames: string[];
  profile: Tables<"profiles"> | null;
  initialQuery?: string;
  initialCity?: string;
}

interface CategoryTile {
  id: string;
  merchantCount: number;
}

/** Real merchant-derived category tiles -- the equivalent of the v0
 *  mock's fetched `PlannoCategory[]`, but grouped from the same
 *  `merchants` this page already loads via searchMerchants(), not a
 *  separate categories table (this schema doesn't have one). */
function buildCategoryTiles(merchants: MerchantListItem[]): CategoryTile[] {
  const byCategory = new Map<string, number>();
  for (const merchant of merchants) {
    byCategory.set(merchant.category, (byCategory.get(merchant.category) ?? 0) + 1);
  }
  return Array.from(byCategory.entries())
    .map(([id, merchantCount]) => ({ id, merchantCount }))
    .sort((a, b) => b.merchantCount - a.merchantCount);
}

function locationLabel(count: number): string {
  return `${count} ${count === 1 ? "locație" : "locații"}`;
}

const SEARCH_PLACEHOLDERS = [
  "Vrei un teren de padel?",
  "Cauți o frizerie?",
  "Programează-te la salon...",
  "Căutare servicii de transport...",
];

const PLACEHOLDER_CYCLE_MS = 3200;
const PLACEHOLDER_FADE_MS = 300;

export function DiscoverHero({
  merchants,
  filterOptions,
  stats,
  reviewerNames,
  profile,
  initialQuery,
  initialCity,
}: DiscoverHeroProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQuery ?? "");
  const [city, setCity] = React.useState(initialCity ?? "");
  const [isPending, startTransition] = React.useTransition();
  const [placeholderIndex, setPlaceholderIndex] = React.useState(0);
  const [placeholderVisible, setPlaceholderVisible] = React.useState(true);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
        setPlaceholderVisible(true);
      }, PLACEHOLDER_FADE_MS);
    }, PLACEHOLDER_CYCLE_MS);
    return () => clearInterval(interval);
  }, []);

  const categoryTiles = React.useMemo(
    () => buildCategoryTiles(city ? merchants.filter((m) => m.city === city) : merchants),
    [merchants, city],
  );

  const filteredTiles = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return categoryTiles;
    // Matches the id too, not just the Romanian label: category
    // labels pluralize irregularly (salon -> Saloane), so a plain
    // substring check against the label alone would miss the exact
    // term most people would type -- the category's own slug.
    return categoryTiles.filter(
      (tile) => categoryLabel(tile.id).toLowerCase().includes(term) || tile.id.toLowerCase().includes(term),
    );
  }, [categoryTiles, query]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city) params.set("city", city);
    startTransition(() => {
      router.push(params.size > 0 ? `/search?${params.toString()}` : "/search");
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pt-6 sm:px-8 lg:px-12">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-semibold tracking-[-0.04em]">
            Planno
          </Link>

          <span className="hidden rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-300 sm:inline-flex">
            Curated locally
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DesktopNavLinks isAuthenticated={Boolean(profile)} />

          {profile ? (
            <AccountMenu fullName={profile.full_name} />
          ) : (
            <Link
              href="/login"
              aria-label="Autentificare"
              className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CircleUserRound className="size-5" strokeWidth={1.7} />
            </Link>
          )}
        </div>
      </header>

      <section className="pt-16 sm:pt-24">
        <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-[-0.06em] text-white sm:text-6xl">
          Rezervă instant serviciile tale preferate.
        </h1>

        <p className="mt-5 max-w-md text-pretty text-sm leading-6 text-zinc-400 sm:text-base">
          De la terenuri de padel și frizerii, până la saloane și transport — simplu și rapid.
        </p>

        {stats.bookingsLast30Days > 0 && (
          <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="relative flex size-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            {stats.bookingsLast30Days} rezervări în ultimele 30 de zile
          </p>
        )}

        {reviewerNames.length > 0 && stats.averageRating !== null && (
          <div className="mt-6 flex items-center gap-2.5">
            <div className="flex -space-x-2">
              {reviewerNames.map((name) => (
                <div
                  key={name}
                  title={name}
                  className="flex size-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-background"
                  style={{ background: avatarGradient(name) }}
                >
                  {initials(name)}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
              <span>
                {stats.averageRating.toFixed(1).replace(".", ",")} din {stats.ratingCount}{" "}
                {stats.ratingCount === 1 ? "recenzie" : "recenzii"}
              </span>
            </div>
          </div>
        )}
      </section>

      <form
        onSubmit={handleSubmit}
        aria-label="Caută și filtrează"
        className="mt-10 flex min-h-14 items-center divide-x divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 shadow-[0_0_0_1px_rgba(63,63,70,0.12)] backdrop-blur-xl"
      >
        <label className="flex min-w-0 flex-1 items-center gap-3 px-4">
          <Search className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
          <span className="sr-only">Caută categorii</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
            className={cn(
              "min-w-0 flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground transition-opacity duration-300",
              // Only the placeholder cross-fades -- once there's real
              // typed text, the interval must never touch the input's
              // own opacity, or the query itself would flicker.
              query.length === 0 && !placeholderVisible && "opacity-0",
            )}
          />
        </label>

        <label className="flex w-36 shrink-0 items-center gap-2 px-4 sm:w-48">
          <span className="sr-only">Alege orașul</span>
          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="w-full appearance-none bg-transparent text-sm outline-none"
          >
            <option value="">Toate orașele</option>
            {filterOptions.cities.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
        </label>

        <button type="submit" disabled={isPending} className="sr-only">
          Caută
        </button>
      </form>

      <div className="mt-14 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-[-0.04em]">
          {city ? `Categorii populare în ${city}` : "Categorii populare"}
        </h2>

        <span className="text-xs text-muted-foreground">
          {filteredTiles.length} {filteredTiles.length === 1 ? "categorie" : "categorii"}
        </span>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 pb-16 sm:gap-5 lg:grid-cols-3" aria-label="Categorii Planno">
        {filteredTiles.map((tile) => {
          const visual = categoryVisual(tile.id);
          return (
            <Link
              key={tile.id}
              href={`/search?category=${tile.id}`}
              className="group relative aspect-[0.86] overflow-hidden rounded-2xl border border-zinc-800 bg-[#121215] text-left shadow-[0_0_0_1px_rgba(63,63,70,0.08)] transition duration-200 hover:border-zinc-700 hover:shadow-[0_0_0_1px_rgba(82,82,91,0.45),0_12px_32px_rgba(0,0,0,0.22)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {visual.photo ? (
                <Image
                  src={visual.photo}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 30vw, 50vw"
                  className="object-cover opacity-35 transition duration-500 group-hover:scale-105 group-hover:opacity-50"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(155deg, ${visual.from}, ${visual.to})` }}
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />

              <span className="absolute right-3 top-3 rounded-full border border-zinc-700/80 bg-zinc-950/65 px-2.5 py-1 text-[10px] font-medium text-zinc-300 backdrop-blur-md">
                {locationLabel(tile.merchantCount)}
              </span>

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <h3 className="text-base font-semibold tracking-[-0.03em] text-white sm:text-xl">
                  {categoryLabel(tile.id)}
                </h3>
                <p className="mt-1 text-xs text-zinc-400">{locationLabel(tile.merchantCount)}</p>
              </div>
            </Link>
          );
        })}
      </section>

      {filteredTiles.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">Nu am găsit încă această categorie.</p>
      )}
    </div>
  );
}
