"use client";

import * as React from "react";
import { Planni } from "@/components/planni";

const SHOW_AFTER_MS = 1000;

/**
 * Planni leaning into the hero with a one-time greeting bubble. Purely
 * decorative and aria-hidden -- it echoes the "Ce vrei să programezi
 * azi?" heading below the showcase, so a screen reader gains nothing
 * from hearing it too.
 */
export function PlanniTip() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShow(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div aria-hidden="true" className="flex items-end gap-2.5">
      <Planni state="welcome" size={56} message="" className="shrink-0" />

      {show && (
        <div className="relative mb-1 animate-in fade-in zoom-in-90 duration-300">
          <div className="relative rounded-xl bg-orange-500 px-3.5 py-2 text-xs font-bold text-black shadow-lg">
            Ce programăm azi?
            <div className="absolute -bottom-1.5 left-6 h-0 w-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-orange-500" />
          </div>
        </div>
      )}
    </div>
  );
}
