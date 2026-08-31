import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import { CategoryIllustration } from "@/components/category-illustration";
import { MerchantHeroActions } from "@/components/merchant-hero-actions";
import { categoryLabel } from "@/lib/categories";
import type { MerchantDetail } from "@/lib/data/merchants";

/** Name, rating, and address live directly on the cover photo (the
 *  gradient wash below is already hardcoded dark regardless of the
 *  site's own theme, same as any photo-caption treatment, so the
 *  overlay text stays light-on-dark too rather than using the
 *  semantic foreground token). */
export function MerchantProfileHero({ merchant }: { merchant: MerchantDetail }) {
  const hasRating = merchant.rating !== null && merchant.rating_count > 0;
  const fullAddress = [merchant.address, merchant.city].filter(Boolean).join(", ");

  return (
    <div className="relative h-56 w-full overflow-hidden sm:h-72 lg:h-80">
      {merchant.cover_image_url ? (
        <Image
          src={merchant.cover_image_url}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <CategoryIllustration category={merchant.category} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10" />
      <MerchantHeroActions businessName={merchant.business_name} />

      <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-5">
        <span className="w-fit rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {categoryLabel(merchant.category)}
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">
          {merchant.business_name}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-300 sm:text-sm">
          {hasRating && (
            <span className="flex items-center font-semibold text-accent">
              <Star className="mr-1 size-4 fill-accent" aria-hidden="true" />
              {merchant.rating!.toFixed(1)}
              <span className="ml-1 font-normal text-zinc-300">
                ({merchant.rating_count} {merchant.rating_count === 1 ? "recenzie" : "recenzii"})
              </span>
            </span>
          )}
          {fullAddress && (
            <span className="flex items-center">
              <MapPin className="mr-1 size-3.5 text-zinc-400" aria-hidden="true" />
              {fullAddress}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
