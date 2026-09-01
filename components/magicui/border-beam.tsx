import * as React from "react";
import { cn } from "@/lib/utils";

export interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
}

/**
 * Magic UI's Border Beam, hand-written for the same reason as
 * ShimmerButton (see components/magicui/shimmer-button.tsx) --
 * magicui.design is unreachable from this sandbox.
 *
 * A gradient "beam" traces the host element's border via a CSS
 * motion path (`offset-path`): the beam is a small square positioned
 * with `offset-path: rect(...)`, which SVG/CSS motion paths treat as
 * the element's own padding-box rectangle, and animating
 * `offset-distance` from 0% to 100% moves it once around that
 * rectangle. Must be placed inside a `relative` ancestor that also
 * sets `overflow-hidden` and the same corner radius (`rounded-[inherit]`
 * picks that radius up automatically) -- it does not create either of
 * those on its own.
 *
 * The beam is a real child <div>, not a `::after` pseudo-element (the
 * original Magic UI source uses `after:`): a pseudo-element can only
 * be styled from an actual CSS rule, never via an inline `style`, and
 * driving its animation through a Tailwind `animate-*` utility means
 * going through `@theme`'s `.animate-x { animation: var(--animate-x) }`
 * indirection -- confirmed (see ShimmerButton's comment) to silently
 * ignore a per-instance CSS variable override in this Chromium
 * version. A real element can take the animation shorthand inline
 * instead, so `--duration`/`--delay` below resolve directly against
 * this element's own cascade with no indirection to go stale.
 */
export function BorderBeam({
  className,
  size = 200,
  duration = 8,
  delay = 0,
  colorFrom = "#f97316",
  colorTo = "#f43f5e",
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": size,
          "--color-from": colorFrom,
          "--color-to": colorTo,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] [border:calc(1*1px)_solid_transparent]",
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]",
        className,
      )}
    >
      <div
        className="absolute aspect-square w-[calc(var(--size)*1px)] [background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] [offset-anchor:90%_50%] [offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]"
        style={{ animation: `border-beam ${duration}s infinite linear`, animationDelay: `-${delay}s` }}
      />
    </div>
  );
}
