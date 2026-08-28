"use client";

import * as React from "react";
import { AnimatePresence, motion, MotionConfig, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export type PlanniState = "welcome" | "empty-state" | "success" | "error" | "loading";

export interface PlanniProps {
  /** Which contextual mood/reaction Planni plays. @default "welcome" */
  state?: PlanniState;
  /** Rendered width in pixels; height follows the mascot's own aspect ratio. @default 160 */
  size?: number;
  /** Caption under the mascot. Omit for the default per-state copy, pass "" for none. */
  message?: string;
  className?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const DEFAULT_MESSAGES: Record<PlanniState, string> = {
  welcome: "Bine ai venit! Sunt Planni.",
  "empty-state": "Nimic pe-aici, deocamdată.",
  success: "Gata! Totul e la locul lui.",
  error: "Ceva nu a mers cum trebuia.",
  loading: "Pregătesc totul...",
};

/** Fixed brand colors -- deliberately not theme (dark/light) reactive, so
 *  Planni reads as the same consistent character everywhere it appears. */
const PALETTE = {
  teal: "#2E6866",
  tealDark: "#1E4A48",
  tealLight: "#5FA69E",
  face: "#EC9A66",
  faceDark: "#DB7F45",
  ink: "#24313A",
  cream: "#FDF6EF",
  danger: "#E5484D",
} as const;

/* ------------------------------------------------------------------ */
/* Animation variants -- one map per independently-animated body part, */
/* keyed by PlanniState so `animate={state}` cross-fades correctly     */
/* whenever the prop changes.                                          */
/* ------------------------------------------------------------------ */

const containerVariants: Variants = {
  initial: { opacity: 0, scale: 0.82, y: 14 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const bodyVariants: Variants = {
  welcome: { x: 0, y: [0, -5, 0], transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } },
  "empty-state": {
    x: 0,
    y: [0, -3, 0],
    rotate: [0, -1.5, 1.5, 0],
    transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
  },
  success: { x: 0, y: [0, -22, 0, -7, 0], transition: { duration: 0.85, ease: "easeOut" } },
  error: { y: 0, x: [0, -7, 7, -5, 5, 0], transition: { duration: 0.5, ease: "easeInOut" } },
  loading: { x: 0, y: [0, -7, 0], transition: { duration: 0.85, repeat: Infinity, ease: "easeInOut" } },
};

const headVariants: Variants = {
  welcome: { rotate: [0, -3, 3, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 } },
  "empty-state": { rotate: [-8, 8, -8], transition: { duration: 5, repeat: Infinity, ease: "easeInOut" } },
  success: { rotate: [0, 7, -5, 0], transition: { duration: 0.7, ease: "easeOut" } },
  error: { rotate: [0, -5, 5, -3, 0], transition: { duration: 0.5, ease: "easeInOut" } },
  loading: { rotate: [0, -2, 2, 0], transition: { duration: 1.7, repeat: Infinity, ease: "easeInOut" } },
};

const armLeftVariants: Variants = {
  welcome: {
    rotate: [-6, -32, -6, -28, -6],
    transition: { duration: 1.6, repeat: Infinity, repeatDelay: 0.4, ease: "easeInOut" },
  },
  "empty-state": { rotate: [-10, -16, -10], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  success: { rotate: [-6, -48, -34], transition: { duration: 0.6, ease: EASE } },
  error: { rotate: -2, transition: { duration: 0.3 } },
  loading: { rotate: [-8, -2, -8], transition: { duration: 1.1, repeat: Infinity, ease: "easeInOut" } },
};

const armRightVariants: Variants = {
  welcome: { rotate: [0, 4, 0], transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } },
  "empty-state": {
    rotate: [-4, -10, -4],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 },
  },
  success: { rotate: [0, -18, -8], transition: { duration: 0.6, ease: EASE, delay: 0.05 } },
  error: { rotate: [0, 4, -4, 0], transition: { duration: 0.5 } },
  loading: { rotate: [0, 5, 0], transition: { duration: 0.85, repeat: Infinity, ease: "easeInOut" } },
};

const badgeVariants: Variants = {
  welcome: { opacity: 1, scale: [0, 1.2, 1], rotate: 0, transition: { duration: 0.5, delay: 0.35, ease: EASE } },
  "empty-state": { opacity: 0, scale: 0.5, rotate: 0, transition: { duration: 0.25 } },
  success: {
    opacity: 1,
    scale: [0, 1.35, 1],
    rotate: [0, -12, 8, 0],
    transition: { duration: 0.6, ease: EASE },
  },
  error: { opacity: 1, scale: [0, 1.15, 1], rotate: 0, transition: { duration: 0.4, ease: EASE } },
  loading: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 0.3 } },
};

const shadowVariants: Variants = {
  welcome: { scaleX: [1, 0.92, 1], opacity: [0.8, 0.6, 0.8], transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } },
  "empty-state": { scaleX: 1, opacity: 0.5, transition: { duration: 0.4 } },
  success: {
    scaleX: [1, 0.65, 1, 0.85, 1],
    opacity: [0.8, 0.35, 0.8, 0.5, 0.8],
    transition: { duration: 0.85, ease: "easeOut" },
  },
  error: { scaleX: 1, opacity: 0.8, transition: { duration: 0.3 } },
  loading: { scaleX: [1, 0.85, 1], opacity: [0.7, 0.5, 0.7], transition: { duration: 0.85, repeat: Infinity, ease: "easeInOut" } },
};

// Precomputed once (and rounded) rather than calling Math.cos/sin inline
// during render: raw trig output can serialize to a slightly different
// last decimal digit between the server render and the client's, which
// React flags as a hydration mismatch on the SVG coordinate attributes.
const round = (n: number) => Math.round(n * 100) / 100;
const SPARKLES = [0, 60, 120, 180, 240, 300].map((angle) => {
  const rad = (angle * Math.PI) / 180;
  return {
    angle,
    x1: round(154 + 16 * Math.cos(rad)),
    y1: round(32 + 16 * Math.sin(rad)),
    x2: round(154 + 24 * Math.cos(rad)),
    y2: round(32 + 24 * Math.sin(rad)),
  };
});

export function Planni({ state = "welcome", size = 160, message, className }: PlanniProps) {
  const caption = message === "" ? null : (message ?? DEFAULT_MESSAGES[state]);
  const isError = state === "error";
  const isSuccess = state === "success";
  const isLoading = state === "loading";
  const showSparkles = state === "welcome" || isSuccess;

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        data-state={state}
        className={cn("flex flex-col items-center gap-3", className)}
        style={{ width: size }}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        role="img"
        aria-label={caption ?? "Planni"}
      >
        <svg
          viewBox="0 0 200 224"
          width={size}
          height={(size * 224) / 200}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="planni-teal" x1="100" y1="12" x2="100" y2="199" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={PALETTE.tealLight} />
              <stop offset="0.55" stopColor={PALETTE.teal} />
              <stop offset="1" stopColor={PALETTE.tealDark} />
            </linearGradient>
            <linearGradient id="planni-face" x1="100" y1="44" x2="100" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={PALETTE.face} />
              <stop offset="1" stopColor={PALETTE.faceDark} />
            </linearGradient>
            <filter id="planni-blur" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* ground shadow */}
          <motion.ellipse
            cx="100"
            cy="210"
            rx="34"
            ry="7"
            fill={PALETTE.tealDark}
            filter="url(#planni-blur)"
            style={{ transformOrigin: "100px 210px" }}
            variants={shadowVariants}
            animate={state}
          />

          {/* body: torso + legs + both arms, bounces/shakes as one unit */}
          <motion.g variants={bodyVariants} animate={state} style={{ transformOrigin: "100px 150px" }}>
            {/* legs */}
            <path
              d="M92 172 C86 180 84 190 86 198 C87 202 93 203 96 200 C100 192 100 180 98 172 Z"
              fill="url(#planni-teal)"
            />
            <ellipse cx="90" cy="200" rx="10" ry="7" fill={PALETTE.face} />

            <path
              d="M108 170 C118 176 126 184 126 193 C126 198 120 201 116 198 C108 191 104 179 104 170 Z"
              fill="url(#planni-teal)"
            />
            <ellipse cx="122" cy="195" rx="10" ry="7" fill={PALETTE.face} />

            {/* torso */}
            <path
              d="M79 118 C79 113 121 113 121 118 C129 134 130 154 118 171 C107 181 93 181 82 171 C70 154 71 134 79 118 Z"
              fill="url(#planni-teal)"
            />

            {/* right arm -- rests near the hip */}
            <motion.g variants={armRightVariants} animate={state} style={{ transformOrigin: "124px 126px" }}>
              <path
                d="M124 126 C136 130 143 140 143 152 C143 158 139 162 134 161 C127 152 122 138 122 126 Z"
                fill="url(#planni-teal)"
              />
              <circle cx="139" cy="157" r="11" fill={PALETTE.face} />
            </motion.g>

            {/* left arm -- waves */}
            <motion.g variants={armLeftVariants} animate={state} style={{ transformOrigin: "76px 122px" }}>
              <path
                d="M76 122 C60 122 47 110 43 94 C41 88 45 83 51 85 C60 96 70 108 78 120 Z"
                fill="url(#planni-teal)"
              />
              <circle cx="45" cy="90" r="12" fill={PALETTE.face} />
            </motion.g>
          </motion.g>

          {/* head -- tilts independently of the body */}
          <motion.g variants={headVariants} animate={state} style={{ transformOrigin: "100px 120px" }}>
            <path
              d="M111 12 C137 33 151 57 149 87 C147 117 125 139 98 139 C70 139 49 118 48 88 C47 57 65 32 92 14 Z"
              fill="url(#planni-teal)"
            />
            <ellipse
              cx="76"
              cy="42"
              rx="13"
              ry="7"
              fill="white"
              opacity="0.35"
              transform="rotate(-30 76 42)"
            />

            <path
              d="M100 44 C123 44 137 58 137 78 C137 97 122 110 100 110 C78 110 63 97 63 78 C63 58 77 44 100 44 Z"
              fill="url(#planni-face)"
            />

            <circle cx="85" cy="73" r="5.5" fill={PALETTE.ink} />
            <circle cx="83.2" cy="71" r="1.6" fill="white" />
            <circle cx="115" cy="73" r="5.5" fill={PALETTE.ink} />
            <circle cx="113.2" cy="71" r="1.6" fill="white" />

            <path
              d="M95 80 L99 84 L106 75"
              stroke={PALETTE.teal}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {isError ? (
              <path d="M91 94 Q100 90 109 94" stroke={PALETTE.ink} strokeWidth="3" strokeLinecap="round" fill="none" />
            ) : isSuccess ? (
              <path d="M85 89 Q100 105 115 89" stroke={PALETTE.ink} strokeWidth="3" strokeLinecap="round" fill="none" />
            ) : (
              <path d="M88 90 Q100 99 112 90" stroke={PALETTE.ink} strokeWidth="3" strokeLinecap="round" fill="none" />
            )}
          </motion.g>

          {/* notification badge: check / exclamation / loading dots */}
          <motion.g variants={badgeVariants} animate={state} style={{ transformOrigin: "154px 32px" }}>
            {showSparkles &&
              SPARKLES.map((s) => (
                <line
                  key={s.angle}
                  x1={s.x1}
                  y1={s.y1}
                  x2={s.x2}
                  y2={s.y2}
                  stroke={PALETTE.face}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              ))}

            <circle cx="154" cy="32" r="13" fill={isError ? PALETTE.danger : PALETTE.teal} stroke={PALETTE.cream} strokeWidth="2" />

            {isError && (
              <>
                <path d="M154 25.5 L154 33" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
                <circle cx="154" cy="38" r="1.4" fill="white" />
              </>
            )}

            {!isError &&
              !isLoading && (
                <path
                  d="M148 32 L152.5 36.5 L161 26"
                  stroke="white"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              )}

            {isLoading &&
              [-5, 0, 5].map((dx, i) => (
                <motion.circle
                  key={dx}
                  cx={154 + dx}
                  cy="32"
                  r="1.8"
                  fill="white"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                />
              ))}
          </motion.g>
        </svg>

        <AnimatePresence mode="wait">
          {caption && (
            <motion.p
              key={caption}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="text-center text-sm font-medium text-balance text-muted-foreground"
            >
              {caption}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
}
