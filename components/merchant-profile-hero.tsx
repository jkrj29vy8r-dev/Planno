import Image from "next/image";
import { CategoryIllustration } from "@/components/category-illustration";
import { MerchantHeroActions } from "@/components/merchant-hero-actions";
import type { MerchantDetail } from "@/lib/data/merchants";

export function MerchantProfileHero({ merchant }: { merchant: MerchantDetail }) {
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10" />
      <MerchantHeroActions businessName={merchant.business_name} />
    </div>
  );
}
