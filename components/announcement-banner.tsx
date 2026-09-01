"use client";

import * as React from "react";
import { X } from "lucide-react";

const DISMISSED_KEY = "planno:announcement-dismissed:v1";

/**
 * Site-wide launch announcement -- replaces the old WelcomeToast (same
 * message, "👋" swapped for "✨"): a persistent in-flow element instead
 * of an auto-hiding floating pill, since "we've just launched here" is
 * worth more than a few seconds of attention. The localStorage key is
 * versioned so a future announcement (bump to v2) shows again for
 * everyone regardless of who already dismissed this one.
 *
 * A minimal dark pill/badge, not a loud full-width bar: sized to its
 * own content (not a fixed width) inside a centered, padded row, so
 * the text can still wrap on a narrow phone instead of overflowing --
 * the same shrink-to-fit-within-bounded-space pattern the original
 * WelcomeToast pill relied on.
 *
 * Rendered above SiteHeader wherever it appears, in normal flow (not
 * fixed): SiteHeader is `sticky top-0`, so this scrolls away first and
 * the header then sticks at the very top of the viewport -- the usual
 * "banner above a sticky nav" behavior, with no coordination needed
 * between the two.
 */
export function AnnouncementBanner() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) !== "1") setShow(true);
    } catch {
      // Storage blocked (private browsing, disabled cookies) -- show
      // it rather than silently hiding an announcement that can't be
      // dismissed persistently either way.
      setShow(true);
    }
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Best-effort: worst case it shows again on the next visit.
    }
  }

  if (!show) return null;

  return (
    <div className="flex justify-center px-4 py-3">
      <div className="flex items-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2">
        <span className="text-xs font-medium text-zinc-300">
          ✨ Planno s-a deschis în zona ta. Rezervă fără telefon!
        </span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Închide"
          className="shrink-0 text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
