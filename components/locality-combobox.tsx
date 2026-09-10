"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchLocalities, getCounties, getLocalitiesInCounty, type RoLocality } from "@/lib/localities";

export interface LocalityComboboxProps {
  id?: string;
  /** The confirmed locality name (e.g. "Cluj-Napoca"), or "" for "all
   *  cities" -- mirrors the value/onChange shape of the native <select>
   *  this replaces, so callers don't need to change how they use it. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface Row {
  key: string;
  primary: string;
  secondary?: string;
  onSelect: () => void;
}

/**
 * Free-text autocomplete over ~4,500 Romanian localities with 1,000+
 * residents (every județ, its reședință, and every city/comună above
 * that threshold -- see lib/localities.ts), replacing a native <select>
 * that only ever listed cities where a merchant already exists.
 *
 * Typing always searches across all ~4,500 (unchanged). With nothing
 * typed, tapping the field browses județ -> localitate in two short
 * steps instead of either showing nothing or dumping every locality
 * into one 4,500-row panel -- either of those is what the native
 * <select> subtly promised ("tap it, see everything") without either
 * being able to actually deliver a scrollable list at that size, or
 * being fast to open on a phone.
 *
 * Deliberately hand-rolled instead of Radix's DropdownMenu (already a
 * dependency): DropdownMenu drives its own roving focus/typeahead across
 * menu items, which fights with typing into a real <input>. Radix's
 * Popover would be the right primitive for this but isn't installed, and
 * this is a small enough listbox that adding it isn't worth it.
 *
 * `value` only ever changes on a confirmed pick (click, Enter, or
 * clearing) -- not on every keystroke -- so an unselected typo can never
 * silently become a literal (and always-empty) city filter. Losing focus
 * without confirming a pick reverts the visible text back to `value`.
 */
export function LocalityCombobox({ id, value, onChange, placeholder = "Toate orașele", className }: LocalityComboboxProps) {
  const [query, setQuery] = React.useState(value);
  const [isOpen, setIsOpen] = React.useState(false);
  const [browsingCounty, setBrowsingCounty] = React.useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setQuery(value);
  }, [value]);

  function commit(locality: RoLocality | null) {
    onChange(locality?.name ?? "");
    setQuery(locality?.name ?? "");
    setIsOpen(false);
    setBrowsingCounty(null);
  }

  const isBrowsing = !query.trim();

  // Cheap linear scans over ~4,500 short strings at most (sub-millisecond)
  // -- not worth memoizing given every dependency here already forces a
  // re-render whenever it changes.
  let rows: Row[];
  if (!isBrowsing) {
    rows = searchLocalities(query, 8).map((locality) => ({
      key: `${locality.name}-${locality.county}`,
      primary: locality.name,
      secondary: locality.county,
      onSelect: () => commit(locality),
    }));
  } else if (browsingCounty === null) {
    rows = getCounties().map((county) => ({
      key: county,
      primary: county,
      onSelect: () => setBrowsingCounty(county),
    }));
  } else {
    rows = getLocalitiesInCounty(browsingCounty).map((locality) => ({
      key: `${locality.name}-${locality.county}`,
      primary: locality.name,
      onSelect: () => commit(locality),
    }));
  }

  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [rows]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) setIsOpen(true);
      setHighlightedIndex((index) => Math.min(index + 1, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (isOpen && rows[highlightedIndex]) rows[highlightedIndex].onSelect();
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setQuery(value);
      setBrowsingCounty(null);
      inputRef.current?.blur();
    }
  }

  return (
    <div className={cn("relative w-full sm:w-44", className)}>
      <MapPin
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={id ? `${id}-listbox` : undefined}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setBrowsingCounty(null);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setIsOpen(false);
          setQuery(value);
          setBrowsingCounty(null);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl bg-input px-9 py-3 text-sm outline-none placeholder:text-muted-foreground"
      />
      {query && (
        <button
          type="button"
          onClick={() => commit(null)}
          aria-label="Șterge orașul selectat"
          className="absolute right-2.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && rows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl p-1.5"
          >
            {isBrowsing && browsingCounty !== null && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setBrowsingCounty(null)}
                className="mb-1 flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-foreground/90 transition-colors hover:bg-muted"
              >
                <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
                {browsingCounty}
              </button>
            )}
            <ul id={id ? `${id}-listbox` : undefined} role="listbox" className="max-h-72 overflow-auto">
              {rows.map((row, index) => (
                <li key={row.key} role="option" aria-selected={index === highlightedIndex}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={row.onSelect}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      index === highlightedIndex ? "bg-muted text-foreground" : "text-foreground/90",
                    )}
                  >
                    <span>{row.primary}</span>
                    {row.secondary && <span className="text-xs text-muted-foreground">{row.secondary}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
