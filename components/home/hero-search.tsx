"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { categoryLabel } from "@/lib/categories";

interface HeroSearchProps {
  cities: string[];
  /** Category ids that actually have merchants, rendered as quick chips
   *  so a chip can never lead to an empty result set. */
  categories: string[];
  initialQuery?: string;
  initialCity?: string;
}

const SEARCH_PLACEHOLDERS = [
  "Caută un tuns bărbați în Roman...",
  "Rezervă o ședință de masaj de relaxare...",
  "Caută antrenor personal de fitness...",
  "Închiriază un teren de padel...",
  "Găsește salon pentru manichiură...",
];

const PLACEHOLDER_INTERVAL_MS = 3000;

export function HeroSearch({ cities, categories, initialQuery, initialCity }: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQuery ?? "");
  const [city, setCity] = React.useState(initialCity ?? "");
  const [isPending, startTransition] = React.useTransition();
  const [placeholderIndex, setPlaceholderIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(
      () => setPlaceholderIndex((i) => (i + 1) % SEARCH_PLACEHOLDERS.length),
      PLACEHOLDER_INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, []);

  function pushSearch(next: { q?: string; city?: string; category?: string }) {
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.city) params.set("city", next.city);
    if (next.category) params.set("category", next.category);

    startTransition(() => {
      router.push(params.size > 0 ? `/?${params.toString()}#rezultate` : "/#rezultate", {
        scroll: true,
      });
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    pushSearch({ q: query.trim() || undefined, city: city || undefined });
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="glass-panel flex flex-col gap-2 rounded-2xl p-2.5 shadow-xl shadow-black/[0.06] sm:flex-row sm:items-center dark:shadow-black/30"
      >
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-3 transition-colors focus-within:bg-muted/50">
          <Search className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Ce serviciu cauți?</span>
          <div className="relative min-w-0 flex-1">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full min-w-0 bg-transparent text-base text-foreground outline-none"
            />
            {query.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={placeholderIndex}
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="block truncate text-base text-muted-foreground/70 sm:text-[13px]"
                  >
                    {SEARCH_PLACEHOLDERS[placeholderIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
          </div>
        </label>

        <span aria-hidden="true" className="hidden h-8 w-px bg-border/60 sm:block" />

        <label className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors focus-within:bg-muted/50 sm:w-48">
          <MapPin className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Oraș</span>
          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-base text-foreground outline-none"
          >
            <option value="">Toate orașele</option>
            {cities.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <Button type="submit" size="lg" className="shrink-0 rounded-xl" isLoading={isPending}>
          Găsește și rezervă
          <ArrowRight className="size-4" />
        </Button>
      </form>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
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
