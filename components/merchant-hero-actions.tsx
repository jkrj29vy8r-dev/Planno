"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Floating circular Back/Share pair overlaid on the profile hero
 *  image. Back uses router.back() (not a hardcoded href) so it returns
 *  wherever the visitor actually came from -- search results with
 *  their filters intact, a booking card, etc. */
export function MerchantHeroActions({ businessName }: { businessName: string }) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);

  async function handleShare() {
    const shareData = { title: businessName, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // AbortError when the user dismisses the native share sheet --
        // not an error worth surfacing.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied by the browser; silently no-op
      // rather than show an error for a non-critical convenience action.
    }
  }

  const buttonClass = cn(
    "flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white",
    "backdrop-blur-md transition-colors hover:bg-black/50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
  );

  return (
    <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between">
      <button type="button" onClick={() => router.back()} aria-label="Înapoi" className={buttonClass}>
        <ArrowLeft className="size-[18px]" aria-hidden="true" />
      </button>
      <button type="button" onClick={handleShare} aria-label="Distribuie" className={buttonClass}>
        {copied ? <Check className="size-[18px]" aria-hidden="true" /> : <Share2 className="size-[18px]" aria-hidden="true" />}
      </button>
    </div>
  );
}
