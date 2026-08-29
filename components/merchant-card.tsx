import Link from "next/link";
import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { categoryVisual } from "@/lib/category-visuals";
import { avatarGradient, initials } from "@/lib/avatar";
import type { MerchantListItem } from "@/lib/data/merchants";

export function MerchantCard({ merchant }: { merchant: MerchantListItem }) {
  const activeServices = merchant.services;
  const fromPrice = activeServices.length > 0 ? Math.min(...activeServices.map((s) => s.price)) : null;
  const currency = activeServices[0]?.currency ?? "RON";
  const visual = categoryVisual(merchant.category);
  const Icon = visual.icon;
  const coverPhoto = merchant.cover_image_url ?? visual.photo;
  const hasRating = merchant.rating !== null && merchant.rating_count > 0;

  return (
    <Link href={`/merchants/${merchant.slug}`} className="group block h-full">
      <Card hover className="flex h-full flex-col overflow-hidden p-0">
        {/* Cover -- a real photo when the merchant has one, otherwise the
            category's own gradient (and photo, if that category has one)
            from lib/category-visuals.ts. Never a flat placeholder rectangle. */}
        <div className="relative h-36 shrink-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(155deg, ${visual.from}, ${visual.to})` }}
          />
          {coverPhoto && (
            <Image
              src={coverPhoto}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover opacity-95 transition-transform duration-500 ease-[var(--ease-premium)] group-hover:scale-105"
            />
          )}
          {!coverPhoto && (
            <Icon
              className="absolute inset-0 m-auto size-9 text-white/50"
              aria-hidden="true"
              strokeWidth={1.5}
            />
          )}

          {/* Bottom scrim: not decorative -- it's what keeps the logo's
              white ring and the category label readable over a bright photo. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10" />

          {hasRating && (
            <div className="glass-panel absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white">
              <Star className="size-3 fill-current" aria-hidden="true" />
              {merchant.rating!.toFixed(1)}
            </div>
          )}

          <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
            {categoryLabel(merchant.category)}
          </span>
        </div>

        {/* Logo -- overlaps the seam between cover and content, the way a
            business avatar sits on a marketplace card (Airbnb, Mero). */}
        <div className="-mt-6 px-5">
          {merchant.logo_url ? (
            <div className="relative size-12 overflow-hidden rounded-xl ring-4 ring-card">
              <Image src={merchant.logo_url} alt="" fill sizes="48px" className="object-cover" />
            </div>
          ) : (
            <div
              className="flex size-12 items-center justify-center rounded-xl text-sm font-semibold text-white ring-4 ring-card"
              style={{ background: avatarGradient(merchant.business_name) }}
              aria-hidden="true"
            >
              {initials(merchant.business_name)}
            </div>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col gap-1.5 px-5 pb-5 pt-2.5">
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
