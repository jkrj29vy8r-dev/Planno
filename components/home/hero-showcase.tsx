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
                  "relative block h-64 overflow-hidden rounded-2xl border border-white/10 transition-all duration-500",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isDimmed ? "opacity-50 blur-[1px]" : "opacity-100",
                  isHovered && "border-orange-500/50 shadow-xl shadow-orange-500/10",
                )}
              >
                {visual.photo ? (
                  <>
                    {/* Same two-tone gradient CategoryIllustration draws
                        with -- the photo's loading/failure backdrop, so
                        a slow or dead URL degrades to a designed tile
                        instead of a blank box. */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(155deg, ${visual.from}, ${visual.to})` }}
                    />
                    <Image
                      src={visual.photo}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                      className={cn(
                        "object-cover transition-transform duration-700 ease-out",
                        isHovered && "scale-[1.08]",
                      )}
                    />
                  </>
                ) : (
                  <CategoryIllustration
                    category={category.id}
                    className={cn("transition-transform duration-700 ease-out", isHovered && "scale-[1.08]")}
                  />
                )}

                {/* Dark tint so a real photo still reads as dark-mode
                    surface, plus a readability floor for the label. */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-t",
                    visual.photo
                      ? "from-black/90 via-black/40 to-transparent"
                      : "from-black/70 via-black/5 to-transparent",
                  )}
                />

                <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-5">
                  <span className="mb-1 text-xs font-medium tracking-wider text-orange-400 uppercase">
                    {category.merchantCount} {category.merchantCount === 1 ? "locație" : "locații"}
                  </span>
                  <h3 className="text-xl font-bold text-white">{showcaseTitle(category.id)}</h3>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </MotionConfig>
  );
}
