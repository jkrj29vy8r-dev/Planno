"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  /** Optional trailing count, e.g. a review or booking total. */
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

/** Horizontal, underline-style tabs -- controlled, so the active tab
 *  can live in whatever state (or URL) the page around it needs. */
export function Tabs({ items, active, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex gap-6 overflow-x-auto border-b border-border/40", className)} role="tablist">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 pb-3 text-sm font-medium transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {item.count !== undefined && <span className="text-xs text-muted-foreground">{item.count}</span>}
            {isActive && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
