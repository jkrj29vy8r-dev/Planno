import { Car, Dumbbell, Flower2, Scissors, Sparkles, Trophy, Truck, type LucideIcon } from "lucide-react";

export interface CategoryVisual {
  icon: LucideIcon;
  /** Two brand-adjacent stops. Deliberately low-chroma so tiles/cards
   *  read as one set rather than a rainbow. Used as the illustration
   *  fallback (see components/category-illustration.tsx) for any
   *  category below without its own confirmed `photo`, and as the
   *  loading/failure backdrop for the ones that have one. */
  from: string;
  to: string;
  /** Real photograph for the homepage category showcase. Only set for
   *  a category once its photo is distinct from every other category's
   *  -- a shared/reused photo across categories is the exact bug this
   *  once had (salon and spa both pointed at the same stock photo).
   *  The gradient + icon illustration is a fully-designed fallback for
   *  everything else, not a stopgap. */
  photo?: string;
}

// salon and barbershop below are Claude's picks, not user-supplied and
// not verified from this sandbox (images.unsplash.com is blocked by
// egress policy here) -- lower confidence than the other three. If
// either doesn't actually read as its category once deployed, swap the
// id and nothing else needs to change: a bad/dead URL already degrades
// to the gradient + icon illustration below rather than a blank tile.
const SALON_PHOTO = "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80&auto=format&fit=crop";
const BARBERSHOP_PHOTO = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80&auto=format&fit=crop";
const SPA_PHOTO = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80&auto=format&fit=crop";
const FITNESS_PHOTO = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80&auto=format&fit=crop";
const AUTO_PHOTO = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop";

/** Shared between the hero showcase and merchant cards, so a category
 *  reads the same everywhere: same icon, same two-tone gradient, same
 *  photo when it has one. A real per-merchant photo still wins when
 *  one is set (merchants.cover_image_url) -- this is only the
 *  category-level fallback. */
export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  salon: { icon: Sparkles, from: "#2E6866", to: "#1E4A48", photo: SALON_PHOTO },
  barbershop: { icon: Scissors, from: "#8A4B2A", to: "#5C2F19", photo: BARBERSHOP_PHOTO },
  spa: { icon: Flower2, from: "#3F6F5E", to: "#24443B", photo: SPA_PHOTO },
  fitness: { icon: Dumbbell, from: "#4A5568", to: "#252C38", photo: FITNESS_PHOTO },
  wellness: { icon: Flower2, from: "#5FA69E", to: "#2E6866" },
  padel: { icon: Trophy, from: "#3D6B8A", to: "#1F3A4D" },
  auto: { icon: Car, from: "#5A5245", to: "#332F28", photo: AUTO_PHOTO },
  transport: { icon: Truck, from: "#6B4E3D", to: "#3A2A21" },
  altele: { icon: Sparkles, from: "#59564F", to: "#302E2A" },
};

export function categoryVisual(category: string): CategoryVisual {
  return CATEGORY_VISUALS[category] ?? CATEGORY_VISUALS.altele;
}
