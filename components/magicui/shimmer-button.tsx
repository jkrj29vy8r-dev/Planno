"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}

/**
 * Magic UI's Shimmer Button, hand-written rather than fetched via
 * `npx shadcn add` (magicui.design is blocked by this sandbox's
 * network policy -- confirmed via a direct request, not assumed) --
 * same component, same technique, just typed in instead of copied by
 * a CLI that can't reach the registry here. A conic-gradient "spark"
 * spins in a masked ::before-like layer and slides across the
 * button's width, giving the metallic sweep; the animations
 * themselves are registered in globals.css since this project has no
 * tailwind.config (Tailwind v4's CSS-first config).
 */
export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      shimmerDuration = "2.5s",
      borderRadius = "9999px",
      background = "linear-gradient(135deg, #f97316, #c2410c)",
      className,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        style={
          {
            "--spread": "90deg",
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": background,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap",
          "border border-white/10 text-white [background:var(--bg)] [border-radius:var(--radius)]",
          "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
          "disabled:cursor-not-allowed disabled:opacity-70",
          className,
        )}
        {...props}
      >
        {/* Spark layer: a conic-gradient wedge spinning inside a
            container clipped to the button's own size, then slid
            across it -- the combination reads as a metallic sweep
            rather than a static glow.
            The animation shorthand is set inline here, not via an
            `animate-shimmer-slide` utility class: Tailwind v4 compiles
            `@theme --animate-*` to `.animate-x { animation: var(--animate-x) }`,
            an extra indirection through a :root-scoped custom property
            whose own value is itself `... calc(var(--speed, 2.5s) * 2) ...`.
            Chromium resolves that inner var(--speed) once against :root
            rather than re-substituting it per element, so a per-button
            --speed override (confirmed present via getComputedStyle)
            was silently ignored and every button animated at the same
            hardcoded fallback speed. Inline style has no such
            indirection -- var(--speed) resolves directly against this
            element's own cascade. */}
        <div className="absolute inset-0 -z-10 overflow-visible blur-[2px] [container-type:size]">
          <div
            className="absolute inset-0 h-[100cqh] [aspect-ratio:1] [border-radius:0]"
            style={{ animation: "shimmer-slide var(--speed) ease-in-out infinite alternate" }}
          >
            <div
              className="absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]"
              style={{ animation: "spin-around calc(var(--speed) * 2) infinite linear" }}
            />
          </div>
        </div>

        {children}

        {/* Inner highlight -- a soft top-down sheen so the button
            still reads as a raised, glossy surface even where the
            spark isn't currently passing. */}
        <div
          className={cn(
            "absolute inset-0 size-full [border-radius:var(--radius)]",
            "shadow-[inset_0_-8px_10px_#ffffff1f]",
            "transform-gpu transition-all duration-300 ease-in-out",
            "group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]",
            "group-active:shadow-[inset_0_-10px_10px_#ffffff3f]",
          )}
        />

        {/* Backdrop: re-paints the button's own background just
            inside the border, so the spark layer behind it never
            bleeds past the button's edges. */}
        <div className="absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]" />
      </button>
    );
  },
);
ShimmerButton.displayName = "ShimmerButton";
