"use client";

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

/** Staggered column offset so the grid reads as a composition rather
 *  than a table. Index-based, never random -- random values differ
 *  between the server and client render and break hydration. */
const OFFSETS = ["mt-0", "mt-8", "mt-0", "mt-8"];

export function HeroShowcase({ categories }: { categories: ShowcaseCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {categories.slice(0, 4).map((category, index) => {
          const visual = categoryVisual(category.id);

          return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 + index * 0.09, ease: [0.16, 1, 0.3, 1] }}
            className={cn(OFFSETS[index % OFFSETS.length])}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 5 + index * 0.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.4,
              }}
            >
              <Link
                href={`/?category=${category.id}#rezultate`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 shadow-lg shadow-black/10 transition-[transform,border-color] duration-300 ease-[var(--ease-premium)] hover:-translate-y-1 hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                      sizes="(min-width: 640px) 22vw, 45vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </>
                ) : (
                  <CategoryIllustration
                    category={category.id}
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                {/* Dark tint so a real photo still reads as dark-mode
                    surface, plus a readability floor for the label. */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-t",
                    visual.photo
                      ? "from-black/80 via-black/45 to-black/20"
                      : "from-black/70 via-black/5 to-transparent",
                  )}
                />

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-[15px] font-semibold tracking-tight text-white">
                    {categoryLabel(category.id)}
                  </p>
                  <p className="mt-0.5 text-xs text-white/70">
                    {category.merchantCount}{" "}
                    {category.merchantCount === 1 ? "afacere" : "afaceri"}
                    {category.fromPrice !== null && ` · de la ${category.fromPrice} ${category.currency}`}
                  </p>
                </div>
              </Link>
            </motion.div>
          </motion.div>
          );
        })}
      </div>
    </MotionConfig>
  );
}
