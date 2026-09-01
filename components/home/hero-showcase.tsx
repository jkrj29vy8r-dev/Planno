"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { categoryLabel } from "@/lib/categories";
import { categoryVisual } from "@/lib/category-visuals";
import { CategoryIllustration } from "@/components/category-illustration";
import { BorderBeam } from "@/components/magicui/border-beam";

export interface ShowcaseCategory {
  id: string;
  merchantCount: number;
  fromPrice: number | null;
  currency: string;
}

/** Longer, marketing-style titles for the categories with a curated
 *  photo. Scoped to this showcase only -- categoryLabel() stays the
 *  short form used everywhere else (filter pills, merchant badges),
 *  where a compound title would be too wide. */
const SHOWCASE_TITLES: Record<string, string> = {
  barbershop: "Frizerii & Barber",
  salon: "Saloane & Înfrumusețare",
  spa: "Spa & Masaj",
  fitness: "Fitness & Sport",
};

function showcaseTitle(categoryId: string): string {
  return SHOWCASE_TITLES[categoryId] ?? categoryLabel(categoryId);
}

/** One-line "what can I book here" copy per tile, shown under the
 *  title. Scoped to this showcase only, same as SHOWCASE_TITLES --
 *  every category is listed explicitly (not just the ones with a
 *  curated photo) since a tile with no tagline at all would look
 *  unfinished next to the others. */
const SHOWCASE_TAGLINES: Record<string, string> = {
  salon: "Rezervă tunsori, coafuri și styling",
  barbershop: "Rezervă tuns și bărbierit clasic",
  spa: "Rezervă masaj și tratamente relaxante",
  fitness: "Rezervă antrenamente și clase",
  wellness: "Rezervă terapii și îngrijire personală",
  padel: "Rezervă terenuri și partide de padel",
  auto: "Rezervă revizii și servicii auto",
  transport: "Rezervă curse și curse speciale",
  altele: "Descoperă alte servicii locale",
};

function showcaseTagline(categoryId: string): string {
  return SHOWCASE_TAGLINES[categoryId] ?? SHOWCASE_TAGLINES.altele;
}

export function HeroShowcase({ categories }: { categories: ShowcaseCategory[] }) {
  const [hovered, setHovered] = React.useState<string | null>(null);

  if (categories.length === 0) return null;

  return (
    <MotionConfig reducedMotion="user">
      {/* Bento layout: tile 0 (the top category) spans 2 columns and
          both rows, the rest fill in around it -- lg:auto-rows-[13rem]
          sizes every implicit row the same, so a row-span-2 tile comes
          out exactly 2 rows + the gap tall with no per-tile height
          math needed. Below lg:, rows aren't explicitly sized, so each
          tile keeps its own height class instead. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[13rem]">
        {categories.slice(0, 4).map((category, index) => {
          const visual = categoryVisual(category.id);
          const isHovered = hovered === category.id;
          const isDimmed = hovered !== null && !isHovered;
          const isFeatured = index === 0;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={() => setHovered(category.id)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                isFeatured ? "sm:col-span-2 lg:col-span-2 lg:row-span-2" : "lg:col-span-1",
                index === 1 && "lg:col-span-2",
              )}
            >
              <Link
                href={`/search?category=${category.id}`}
                className={cn(
                  "relative block overflow-hidden rounded-2xl border border-zinc-800 bg-[#121215] shadow-md transition-all duration-500",
                  "active:scale-[0.98] active:duration-150",
                  isFeatured ? "h-56 sm:h-64 lg:h-full" : "h-48 lg:h-full",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isDimmed ? "opacity-50 blur-[1px]" : "opacity-100",
                  isHovered && "border-orange-500/50 shadow-xl shadow-orange-500/10",
                )}
              >
                {/* Category's own two-tone gradient -- the loading
                    backdrop for the photo case, and the entire visual
                    for categories with no curated photo yet (via
                    CategoryIllustration below), so those still read as
                    a fully-designed tile instead of a flat dark box. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(155deg, ${visual.from}, ${visual.to})` }}
                />

                {visual.photo ? (
                  <Image
                    src={visual.photo}
                    alt=""
                    fill
                    sizes={
                      isFeatured
                        ? "(min-width: 1024px) 45vw, 100vw"
                        : "(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                    }
                    className={cn(
                      "object-cover transition-transform duration-700 ease-out",
                      isHovered && "scale-[1.08]",
                    )}
                  />
                ) : (
                  // Draws the identical per-category gradient over the
                  // one above (same categoryVisual() lookup), plus the
                  // orbs and icon chip -- redundant paint, not a
                  // visible seam, and simpler than trying to suppress
                  // just its background layer.
                  <CategoryIllustration
                    category={category.id}
                    className={cn("transition-transform duration-700 ease-out", isHovered && "scale-[1.08]")}
                  />
                )}

                {/* Dark overlay for legibility -- both the frosted
                    badge and the bottom text need real contrast under
                    them, which a translucent white badge especially
                    can't supply on its own the way the old solid-orange
                    pill could. */}
                <div aria-hidden="true" className="absolute inset-0 bg-black/60" />

                <div className="absolute inset-0 z-10 flex flex-col justify-between p-4">
                  <span className="w-fit rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
                    {category.merchantCount} {category.merchantCount === 1 ? "locație" : "locații"}
                  </span>
                  <div>
                    <h3
                      className={cn(
                        "font-bold tracking-wide text-white",
                        isFeatured ? "text-2xl" : "text-xl",
                      )}
                    >
                      {showcaseTitle(category.id)}
                    </h3>
                    <p className="text-xs text-white/70">{showcaseTagline(category.id)}</p>
                  </div>
                </div>

                {/* The top category gets the marquee treatment -- a
                    light beam tracing the tile's own border, the same
                    rounded-2xl radius via rounded-[inherit]. */}
                {isFeatured && <BorderBeam size={140} duration={7} />}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </MotionConfig>
  );
}
