"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { MotionConfig, motion } from "framer-motion";
import { Car, Dumbbell, Flower2, Scissors, Sparkles, Trophy, Truck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryLabel } from "@/lib/categories";

export interface ShowcaseCategory {
  id: string;
  merchantCount: number;
  fromPrice: number | null;
  currency: string;
}

interface CategoryVisual {
  icon: LucideIcon;
  /** Two brand-adjacent stops. Deliberately low-chroma so the tiles read
   *  as a set rather than a rainbow. */
  from: string;
  to: string;
  /** Optional real photograph. Drop in a URL (see next.config.ts
   *  remotePatterns) and it renders on top of the gradient, which then
   *  becomes the loading/fallback backdrop. */
  photo?: string;
}

const VISUALS: Record<string, CategoryVisual> = {
  salon: { icon: Sparkles, from: "#2E6866", to: "#1E4A48" },
  barbershop: { icon: Scissors, from: "#8A4B2A", to: "#5C2F19" },
  spa: { icon: Flower2, from: "#3F6F5E", to: "#24443B" },
  fitness: { icon: Dumbbell, from: "#4A5568", to: "#252C38" },
  wellness: { icon: Flower2, from: "#5FA69E", to: "#2E6866" },
  padel: { icon: Trophy, from: "#3D6B8A", to: "#1F3A4D" },
  auto: { icon: Car, from: "#5A5245", to: "#332F28" },
  transport: { icon: Truck, from: "#6B4E3D", to: "#3A2A21" },
  altele: { icon: Sparkles, from: "#59564F", to: "#302E2A" },
};

const FALLBACK: CategoryVisual = VISUALS.altele;

/** Staggered column offset so the grid reads as a composition rather
 *  than a table. Index-based, never random -- random values differ
 *  between the server and client render and break hydration. */
const OFFSETS = ["mt-0", "mt-8", "mt-0", "mt-8"];

export function HeroShowcase({ categories }: { categories: ShowcaseCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {categories.slice(0, 4).map((category, index) => {
          const visual = VISUALS[category.id] ?? FALLBACK;
          const Icon = visual.icon;

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
                  className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 shadow-lg shadow-black/10 transition-transform duration-300 ease-[var(--ease-premium)] hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(155deg, ${visual.from}, ${visual.to})` }}
                  />

                  {visual.photo && (
                    <Image
                      src={visual.photo}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 45vw, 240px"
                      className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                    />
                  )}

                  {/* Readability floor for the label, and a soft sheen so
                      the flat gradient does not look like a colour swatch. */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute -right-8 -top-8 size-28 rounded-full bg-white/10 blur-2xl" />

                  <Icon
                    className="absolute right-4 top-4 size-5 text-white/70 transition-colors group-hover:text-white"
                    aria-hidden="true"
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
