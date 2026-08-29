import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { formatDateLong } from "@/lib/format";
import type { MerchantSubscriptionAccess } from "@/lib/data/subscription";

/**
 * Grace-period warning. Bookings still work here -- this is the last
 * chance to renew before merchant_accepts_bookings() starts returning
 * false and the paywall takes over.
 */
export function SubscriptionBanner({ access }: { access: MerchantSubscriptionAccess }) {
  if (access.state !== "grace" || !access.subscription) return null;

  const daysLeft = access.daysLeft ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-destructive/25 bg-destructive/[0.06] px-6 py-3">
      <AlertTriangle className="size-4 shrink-0 text-destructive" />
      <p className="text-sm">
        <span className="font-medium">
          Abonamentul a expirat pe {formatDateLong(new Date(access.subscription.expires_at))}.
        </span>{" "}
        <span className="text-muted-foreground">
          {daysLeft > 0
            ? `Mai ai ${daysLeft} ${daysLeft === 1 ? "zi" : "zile"} până când nu vei mai primi rezervări.`
            : "Astăzi este ultima zi în care mai primești rezervări."}
        </span>
      </p>
      <Link
        href="/merchant/dashboard/subscription"
        className={`${buttonVariants({ variant: "primary", size: "sm" })} ml-auto`}
      >
        Reînnoiește
      </Link>
    </div>
  );
}
