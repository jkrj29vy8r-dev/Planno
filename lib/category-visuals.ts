import { Car, Dumbbell, Flower2, Scissors, Sparkles, Trophy, Truck, type LucideIcon } from "lucide-react";

export interface CategoryVisual {
  icon: LucideIcon;
  /** Two brand-adjacent stops. Deliberately low-chroma so tiles/cards
   *  read as one set rather than a rainbow. */
  from: string;
  to: string;
}

/** Shared between the hero showcase and merchant cards, so a category
 *  reads the same everywhere: same icon, same two-tone gradient. This
 *  is deliberately illustration-only (see components/category-
 *  illustration.tsx) rather than stock photography -- a shared photo
 *  library inevitably repeats the same image across categories that
 *  don't have their own, which reads as generic rather than crafted. A
 *  real per-merchant photo still wins when one is set (merchants.
 *  cover_image_url), this is only the fallback. */
export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
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

export function categoryVisual(category: string): CategoryVisual {
  return CATEGORY_VISUALS[category] ?? CATEGORY_VISUALS.altele;
}
