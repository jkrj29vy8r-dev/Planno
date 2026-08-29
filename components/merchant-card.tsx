import Link from "next/link";
import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryIllustration } from "@/components/category-illustration";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { avatarGradient, initials } from "@/lib/avatar";
import type { MerchantListItem } from "@/lib/data/merchants";

export function MerchantCard({ merchant }: { merchant: MerchantListItem }) {
  const activeServices = merchant.services;
  const fromPrice = activeServices.length > 0 ? Math.min(...activeServices.map((s) => s.price)) : null;
  const currency = activeServices[0]?.currency ?? "RON";
  const hasRating = merchant.rating !== null && merchant.rating_count > 0;

  return (
    <Link href={`/merchants/${merchant.slug}`} className="group block h-full">
      <Card hover className="flex h-full flex-col overflow-hidden p-0">
        {/* Cover: a real photo when the merchant has set one, otherwise a
            generated illustration for its category (never a shared stock
            photo -- see components/category-illustration.tsx for why).
            Every overlay below (label, rating, logo) is positioned INSIDE
            this box with real margin from every edge, so nothing straddles
            the seam with the content area and nothing can clip. */}
        <div className="relative h-36 shrink-0 overflow-hidden">
          {merchant.cover_image_url ? (
            <Image
              src={merchant.cover_image_url}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-[var(--ease-premium)] group-hover:scale-105"
            />
          ) : (
            <CategoryIllustration
              category={merchant.category}
              className="transition-transform duration-500 ease-[var(--ease-premium)] group-hover:scale-105"
            />
          )}

          {/* Bottom scrim: keeps the logo's ring and the category label
              readable regardless of what sits underneath it. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/10" />

          <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
            {categoryLabel(merchant.category)}
          </span>

          {hasRating && (
            <div className="glass-panel absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white">
              <Star className="size-3 fill-current" aria-hidden="true" />
              {merchant.rating!.toFixed(1)}
            </div>
          )}

          {/* Logo, bottom-left of the cover with real padding on every
              side (12px bottom, 16px left) -- fully inside this h-36 box,
              never overlapping into CardContent below. */}
          <div className="absolute bottom-3 left-4">
            {merchant.logo_url ? (
              <div className="relative size-11 overflow-hidden rounded-xl ring-2 ring-white/90">
                <Image src={merchant.logo_url} alt="" fill sizes="44px" className="object-cover" />
              </div>
            ) : (
              <div
                className="flex size-11 items-center justify-center rounded-xl text-sm font-semibold text-white ring-2 ring-white/90"
                style={{ background: avatarGradient(merchant.business_name) }}
                aria-hidden="true"
              >
                {initials(merchant.business_name)}
              </div>
            )}
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col gap-1.5 px-5 pb-5 pt-4">
          <h3 className="truncate text-[15px] font-semibold tracking-tight">{merchant.business_name}</h3>

          {merchant.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {merchant.description}
            </p>
          )}

          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            {merchant.city ? (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{merchant.city}</span>
              </span>
            ) : (
              <span />
            )}
            {fromPrice !== null && (
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold text-foreground",
                  "transition-colors group-hover:text-accent",
                )}
              >
                de la {formatPrice(fromPrice, currency)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
