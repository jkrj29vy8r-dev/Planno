"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MerchantFilterOptions } from "@/lib/data/merchants";

const CATEGORY_LABELS: Record<string, string> = {
  salon: "Saloane",
  barbershop: "Frizerii",
  spa: "Spa",
  fitness: "Fitness",
  wellness: "Wellness",
  altele: "Altele",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

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
      <Input
        placeholder="Caută un salon, o frizerie, un spa..."
        leftIcon={<Search className="size-4" />}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="max-w-md"
      />

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
            <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
            {filterOptions.cities.map((city) => (
              <FilterChip
                key={city}
                active={activeCity === city}
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
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border/60 bg-transparent text-foreground/80 hover:bg-muted/60",
      )}
    >
      {children}
    </button>
  );
}
