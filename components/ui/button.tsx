"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-foreground shadow-sm shadow-black/5 hover:brightness-110 active:brightness-95",
        secondary:
          "border border-border/40 bg-muted text-foreground hover:bg-muted/70",
        outline:
          "border border-border/60 bg-transparent text-foreground hover:bg-muted/50",
        ghost: "bg-transparent text-foreground hover:bg-muted/60",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm shadow-black/5 hover:brightness-110 active:brightness-95",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10 shrink-0 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  /** Pulls the button gently toward the cursor while hovered. On by
   *  default for primary/secondary sizes; disable for dense UI (e.g.
   *  toolbar icon buttons) where the movement would feel noisy. */
  magnetic?: boolean;
  /** 0-1, how strongly the button follows the cursor. */
  magneticStrength?: number;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      magnetic = true,
      magneticStrength = 0.35,
      disabled,
      children,
      onMouseMove,
      onMouseLeave,
      ...props
    },
    forwardedRef,
  ) => {
    const innerRef = React.useRef<HTMLButtonElement>(null);
    const setRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    const prefersReducedMotion = useReducedMotion();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 300, damping: 20, mass: 0.5 });
    const springY = useSpring(y, { stiffness: 300, damping: 20, mass: 0.5 });

    const isMagnetic = magnetic && !disabled && !isLoading && !prefersReducedMotion;

    const handleMouseMove: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      if (isMagnetic && innerRef.current) {
        const rect = innerRef.current.getBoundingClientRect();
        x.set((event.clientX - (rect.left + rect.width / 2)) * magneticStrength);
        y.set((event.clientY - (rect.top + rect.height / 2)) * magneticStrength);
      }
      onMouseMove?.(event);
    };

    const handleMouseLeave: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      x.set(0);
      y.set(0);
      onMouseLeave?.(event);
    };

    return (
      <motion.button
        ref={setRefs}
        style={isMagnetic ? { x: springX, y: springY } : undefined}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileTap={disabled || isLoading ? undefined : { scale: 0.97 }}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {children}
      </motion.button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
