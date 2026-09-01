"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryLabel } from "@/lib/categories";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

interface HeroSearchProps {
  /** Category ids that actually have merchants, rendered as quick chips
   *  so a chip can never lead to an empty result set. */
  categories: string[];
  initialQuery?: string;
  initialCity?: string;
}

const PLACEHOLDERS = [
  "Caută un tuns bărbați în București...",
  "Rezervă o ședință de masaj de relaxare...",
  "Caută un antrenor personal de fitness...",
  "Închiriază un teren de padel...",
  "Găsește un salon de manichiură...",
];

const CYCLE_MS = 3200;
const FADE_MS = 300;

export function HeroSearch({ categories, initialQuery, initialCity }: HeroSearchProps) {
  const router = useRouter();
  const [currentPlaceholder, setCurrentPlaceholder] = React.useState(0);
  const [fade, setFade] = React.useState(true);
  const [query, setQuery] = React.useState(initialQuery ?? "");
  const [location, setLocation] = React.useState(initialCity ?? "");
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % PLACEHOLDERS.length);
        setFade(true);
      }, FADE_MS);
    }, CYCLE_MS);

    return () => clearInterval(interval);
  }, []);

  function pushSearch(next: { q?: string; city?: string; category?: string }) {
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.city) params.set("city", next.city);
    if (next.category) params.set("category", next.category);

    // Lands on the dedicated /search route rather than an in-page
    // anchor, so a search is a real navigation the nav bar can reflect.
    startTransition(() => {
      router.push(params.size > 0 ? `/search?${params.toString()}` : "/search", { scroll: true });
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    pushSearch({ q: query.trim() || undefined, city: location.trim() || undefined });
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="relative mx-auto flex w-full max-w-2xl flex-col items-center rounded-2xl border border-white/10 bg-zinc-900/80 p-2 shadow-2xl backdrop-blur-xl transition-all hover:border-orange-500/30 sm:flex-row sm:rounded-full"
      >
        <div className="flex w-full min-w-0 items-center px-4 py-2 sm:py-0">
          <Search className="mr-3 size-5 shrink-0 text-zinc-400" aria-hidden="true" />
          <span className="sr-only">Ce serviciu cauți?</span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={PLACEHOLDERS[currentPlaceholder]}
            className={cn(
              "w-full min-w-0 truncate bg-transparent text-sm text-white outline-none placeholder-zinc-500 transition-opacity duration-300 sm:text-base",
              // Only the placeholder cross-fades -- once there's real
              // typed text, `fade` toggling must never touch its
              // opacity, or the query itself would flicker invisible
              // every cycle.
              query.length === 0 && !fade && "opacity-0",
            )}
          />
        </div>

        <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden="true" />

        <div className="flex w-full min-w-0 items-center border-t border-white/5 px-4 py-2 sm:w-auto sm:border-t-0 sm:py-0">
          <MapPin className="mr-2 size-5 shrink-0 text-orange-500" aria-hidden="true" />
          <span className="sr-only">Oraș</span>
          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="București"
            className="w-full min-w-0 truncate bg-transparent text-sm text-white outline-none placeholder-zinc-500 sm:w-28 sm:text-base"
          />
        </div>

        <ShimmerButton
          type="submit"
          disabled={isPending}
          shimmerDuration="2.2s"
          className="mt-2 w-full shrink-0 px-6 py-3 text-sm font-semibold shadow-lg shadow-orange-500/20 sm:mt-0 sm:w-auto"
        >
          {isPending ? "Se caută..." : "Caută"}
        </ShimmerButton>
      </form>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Populare:</span>
          {categories.slice(0, 5).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => pushSearch({ category })}
              className={cn(
                "rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium",
                "text-foreground/80 backdrop-blur transition-colors hover:border-accent/40 hover:text-accent",
              )}
            >
              {categoryLabel(category)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
