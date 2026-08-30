import { MapPin, Star } from "lucide-react";
import { categoryLabel } from "@/lib/categories";
import type { MerchantDetail } from "@/lib/data/merchants";

export function MerchantProfileHeader({ merchant }: { merchant: MerchantDetail }) {
  const hasRating = merchant.rating !== null && merchant.rating_count > 0;
  const fullAddress = [merchant.address, merchant.city].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-3 py-6">
      <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        {categoryLabel(merchant.category)}
      </span>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {merchant.business_name}
        </h1>

        {hasRating && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">
            <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
            {merchant.rating!.toFixed(1)}
            <span className="font-normal text-muted-foreground">
              ({merchant.rating_count} {merchant.rating_count === 1 ? "recenzie" : "recenzii"})
            </span>
          </div>
        )}
      </div>

      {fullAddress && (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          {fullAddress}
        </span>
      )}
    </div>
  );
}
