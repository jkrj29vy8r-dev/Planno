"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

const SHOW_AFTER_MS = 600;
const VISIBLE_MS = 5000;

/**
 * A one-time greeting for the visit, not the theme -- deliberately dark
 * chrome regardless of light/dark mode, like a native OS notification,
 * rather than the semantic bg-card/text-foreground tokens that would
 * flip with the site's theme. Exit uses the same AnimatePresence as the
 * auto-hide path (not a plain unmount) so dismissing early animates out
 * instead of cutting off abruptly.
 *
 * No backdrop-blur here even though the visual is going for a frosted
 * look: this element is both `fixed` and animated via a framer-motion
 * `transform` (the slide-in y offset), and backdrop-filter combined
 * with an animated transform on the same element is a known WebKit
 * compositing bug -- the blurred fill can fail to paint entirely,
 * leaving only the border visible. bg-zinc-900/90 is opaque enough on
 * its own not to need the blur-behind effect.
 */
export function WelcomeToast() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const showTimer = setTimeout(() => setShow(true), SHOW_AFTER_MS);
    return () => clearTimeout(showTimer);
  }, []);

  React.useEffect(() => {
    if (!show) return;
    const hideTimer = setTimeout(() => setShow(false), VISIBLE_MS);
    return () => clearTimeout(hideTimer);
  }, [show]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-6">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex items-center gap-3 rounded-full border border-orange-500/30 bg-zinc-900/90 px-4 py-2.5 text-white shadow-2xl"
          >
            <Sparkles className="size-4 shrink-0 text-orange-400" aria-hidden="true" />
            <span className="text-xs font-medium sm:text-sm">
              👋 Planno s-a deschis în zona ta. Rezervă fără telefon!
            </span>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="ml-1 p-0.5 text-zinc-400 transition-colors hover:text-white"
              aria-label="Închide"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
