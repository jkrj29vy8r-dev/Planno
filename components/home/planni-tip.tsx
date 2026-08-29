"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Planni } from "@/components/planni";

/**
 * Planni leaning into the hero with a rotating suggestion. Purely
 * decorative and aria-hidden -- the tips repeat what the search bar and
 * category chips already offer, so a screen reader gains nothing from
 * hearing them cycle.
 */
export function PlanniTip({ tips }: { tips: string[] }) {
  const [index, setIndex] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  // Deferred to the client so the server and first client render agree;
  // the entrance animation then plays once, after paint.
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (tips.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % tips.length), 4800);
    return () => clearInterval(timer);
  }, [tips.length]);

  if (tips.length === 0) return null;

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0, y: 10 }}
      animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none flex items-end gap-2.5"
    >
      <Planni state="welcome" size={56} message="" className="shrink-0" />

      <div className="glass-panel relative mb-1 rounded-2xl rounded-bl-sm px-3.5 py-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.28 }}
            className="text-xs leading-snug text-muted-foreground"
          >
            {tips[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
