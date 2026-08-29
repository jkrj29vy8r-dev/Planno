"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPin, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryLabel } from "@/lib/categories";
import type { MerchantFilterOptions } from "@/lib/data/merchants";

interface MerchantSearchProps {
  filterOptions: MerchantFilterOptions;
  activeQuery?: string;
  activeCategory?: string;
  activeCity?: string;
}

export function MerchantSearch({
  filterOptions,
  activeQuery,
  activeCategory,
  activeCity,
}: MerchantSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(activeQuery ?? "");
  const [focused, setFocused] = React.useState(false);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  }

  React.useEffect(() => {
    const current = activeQuery ?? "";
    if (query === current) return;
    const timeout = setTimeout(() => updateParam("q", query || null), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "flex max-w-md items-center gap-2.5 rounded-xl border bg-card px-4 py-3 shadow-sm transition-all duration-200 ease-[var(--ease-premium)]",
          focused ? "border-accent/50 shadow-md ring-4 ring-ring" : "border-border/50 hover:border-border",
        )}
      >
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Caută un salon, o frizerie, un spa..."
          className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Șterge căutarea"
            className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={!activeCategory} onClick={() => updateParam("category", null)}>
          Toate
        </FilterChip>
        {filterOptions.categories.map((category) => (
          <FilterChip
            key={category}
            active={activeCategory === category}
            onClick={() => updateParam("category", activeCategory === category ? null : category)}
          >
            {categoryLabel(category)}
          </FilterChip>
        ))}

        {filterOptions.cities.length > 0 && (
          <>
            <span aria-hidden="true" className="mx-1.5 h-5 w-px bg-border/70" />
            {filterOptions.cities.map((city) => (
              <FilterChip
                key={city}
                active={activeCity === city}
                icon={<MapPin className="size-3.5" />}
                onClick={() => updateParam("city", activeCity === city ? null : city)}
              >
                {city}
              </FilterChip>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-[var(--ease-premium)]",
        active
          ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon && <span className={cn(active ? "opacity-90" : "opacity-60")}>{icon}</span>}
      {children}
    </button>
  );
}
