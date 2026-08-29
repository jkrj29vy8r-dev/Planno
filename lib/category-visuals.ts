import { Car, Dumbbell, Flower2, Scissors, Sparkles, Trophy, Truck, type LucideIcon } from "lucide-react";

export interface CategoryVisual {
  icon: LucideIcon;
  /** Two brand-adjacent stops. Deliberately low-chroma so tiles/cards
   *  read as one set rather than a rainbow. */
  from: string;
  to: string;
  /** Optional real photograph, rendered on top of the gradient, which
   *  then becomes its loading/failure backdrop. See next.config.ts
   *  remotePatterns for which hosts are allowed. */
  photo?: string;
}

// Unsplash photo IDs supplied directly by the user for the categories
// that currently have real merchants. Not fetched or verified from this
// environment -- images.unsplash.com is blocked by egress policy here --
// but Vercel's own render servers sit outside that policy.
const SALON_SPA_PHOTO = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80&auto=format&fit=crop";
const FITNESS_PHOTO = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80&auto=format&fit=crop";
const AUTO_TRANSPORT_PHOTO = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop";

/** Shared between the hero showcase and merchant cards, so a category
 *  reads the same everywhere: same icon, same two-tone gradient, same
 *  photo when one is assigned. Used as the cover art fallback for any
 *  merchant that hasn't set their own cover_image_url. */
export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  salon: { icon: Sparkles, from: "#2E6866", to: "#1E4A48", photo: SALON_SPA_PHOTO },
  barbershop: { icon: Scissors, from: "#8A4B2A", to: "#5C2F19" },
  spa: { icon: Flower2, from: "#3F6F5E", to: "#24443B", photo: SALON_SPA_PHOTO },
  fitness: { icon: Dumbbell, from: "#4A5568", to: "#252C38", photo: FITNESS_PHOTO },
  wellness: { icon: Flower2, from: "#5FA69E", to: "#2E6866" },
  padel: { icon: Trophy, from: "#3D6B8A", to: "#1F3A4D" },
  auto: { icon: Car, from: "#5A5245", to: "#332F28", photo: AUTO_TRANSPORT_PHOTO },
  transport: { icon: Truck, from: "#6B4E3D", to: "#3A2A21", photo: AUTO_TRANSPORT_PHOTO },
  altele: { icon: Sparkles, from: "#59564F", to: "#302E2A" },
};

export function categoryVisual(category: string): CategoryVisual {
  return CATEGORY_VISUALS[category] ?? CATEGORY_VISUALS.altele;
}
