"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

const SHOW_AFTER_MS = 1000;

/** Floats above whichever element it's placed inside (must be
 *  `relative`), centered on that element's own width so it never
 *  depends on the mascot's exact rendered size. */
export function PlanniSpeechBubble() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShow(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-full z-10 mb-2 flex justify-center">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel whitespace-nowrap rounded-2xl px-3.5 py-2 text-sm font-medium text-foreground shadow-lg"
          >
            Ce programăm azi?
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
