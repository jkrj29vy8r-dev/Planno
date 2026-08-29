import { cva, type VariantProps } from "class-variance-authority";

/**
 * Lives outside components/ui/button.tsx on purpose. That file is a
 * "use client" module, and a function exported from a client module
 * becomes a client reference when a Server Component imports it --
 * calling it during a server render then throws. Server Components
 * (SiteHeader, not-found pages, the merchant layout) style plain
 * <Link>s with these classes, so the definition has to sit in a
 * boundary-free module both sides can import.
 */
export const buttonVariants = cva(
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

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
