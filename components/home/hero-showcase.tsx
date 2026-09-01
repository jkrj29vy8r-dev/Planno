"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { categoryLabel } from "@/lib/categories";
import { categoryVisual } from "@/lib/category-visuals";
import { CategoryIllustration } from "@/components/category-illustration";

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.slice(0, 4).map((category, index) => {
          const visual = categoryVisual(category.id);
          const isHovered = hovered === category.id;
          const isDimmed = hovered !== null && !isHovered;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={() => setHovered(category.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <Link
                href={`/search?category=${category.id}`}
                className={cn(
                  "relative block h-40 overflow-hidden rounded-2xl border border-white/10 shadow-md transition-all duration-500",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isDimmed ? "opacity-50 blur-[1px]" : "opacity-100",
                  isHovered && "border-orange-500/50 shadow-xl shadow-orange-500/10",
                )}
              >
                {/* Category's own two-tone gradient, always the base
                    layer now (not just a loading/failure backdrop): the
                    photo sits at opacity-40 over it on purpose, so the
                    brand color tints the whole tile instead of being
                    fully hidden behind the photo -- categories keep
                    reading as visually distinct even though every tile
                    now shares the same dark, muted treatment. */}
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
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                    className={cn(
                      "object-cover opacity-40 transition-transform duration-700 ease-out",
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

                <div className="absolute inset-0 z-10 flex flex-col justify-between p-4">
                  <span className="w-fit rounded-full bg-orange-500/80 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur-sm">
                    {category.merchantCount} {category.merchantCount === 1 ? "locație" : "locații"}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold tracking-wide text-white">{showcaseTitle(category.id)}</h3>
                    <p className="text-xs text-white/70">{showcaseTagline(category.id)}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </MotionConfig>
  );
}
