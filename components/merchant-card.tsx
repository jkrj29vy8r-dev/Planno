import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import type { MerchantListItem } from "@/lib/data/merchants";

export function MerchantCard({ merchant }: { merchant: MerchantListItem }) {
  const activeServices = merchant.services;
  const fromPrice = activeServices.length > 0 ? Math.min(...activeServices.map((s) => s.price)) : null;
  const currency = activeServices[0]?.currency ?? "RON";

  return (
    <Link href={`/merchants/${merchant.slug}`} className="block h-full">
      <Card hover className="flex h-full flex-col">
        <CardHeader>
          <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {categoryLabel(merchant.category)}
          </span>
          <CardTitle>{merchant.business_name}</CardTitle>
          {merchant.description && (
            <CardDescription className="line-clamp-2">{merchant.description}</CardDescription>
          )}
        </CardHeader>
        <CardFooter className="mt-auto justify-between border-t border-border/40 pt-4">
          {merchant.city ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {merchant.city}
            </span>
          ) : (
            <span />
          )}
          {fromPrice !== null && (
            <span className="font-mono text-sm font-medium">
              de la {formatPrice(fromPrice, currency)}
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
