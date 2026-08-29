"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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

export function HeroSearch({ cities, categories, initialQuery, initialCity }: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQuery ?? "");
  const [city, setCity] = React.useState(initialCity ?? "");
  const [isPending, startTransition] = React.useTransition();

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
        className="glass-panel flex flex-col gap-2 rounded-2xl p-2 shadow-xl shadow-black/[0.06] sm:flex-row sm:items-center dark:shadow-black/30"
      >
        <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-colors focus-within:bg-muted/50">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Ce serviciu cauți?</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tuns, masaj, antrenament personal..."
            className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </label>

        <span aria-hidden="true" className="hidden h-8 w-px bg-border/60 sm:block" />

        <label className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-colors focus-within:bg-muted/50 sm:w-52">
          <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Oraș</span>
          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-[15px] text-foreground outline-none"
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
