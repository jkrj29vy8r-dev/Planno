"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

const SHOW_AFTER_MS = 500;
const VISIBLE_MS = 4000;

/**
 * A one-time greeting for the visit, not the theme -- deliberately dark
 * chrome regardless of light/dark mode, like a native OS notification,
 * rather than the semantic bg-card/text-foreground tokens that would
 * flip with the site's theme.
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
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-6 sm:top-6">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-black/80 px-4 py-2.5 text-center text-sm text-white/90 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <span aria-hidden="true">👋</span>
            <span>
              Planno s-a deschis în zona ta.{" "}
              <span className="font-medium text-[#EC9A66]">Rezervă fără telefon!</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
