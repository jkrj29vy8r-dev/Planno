"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Drawer } from "vaul";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

/** Below Tailwind's `md` breakpoint (768px), matching every other
 *  desktop/mobile split in this app. Only ever read once a modal is
 *  actually opened by a user action well after hydration, so there's
 *  no SSR-mismatch window to worry about despite reading `window`
 *  directly in the initializer. */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}

/**
 * Controlled dialog -- a centered card on desktop, an iOS-style
 * vaul bottom sheet below `md`. These are two genuinely different
 * component trees (Radix Dialog vs. vaul's Drawer, which wraps Radix
 * Dialog itself), not one tree restyled with breakpoint classes, so
 * `useIsMobile` picks between them entirely in JS rather than CSS --
 * there's no way to make a single element "become" the other at a
 * media query. ModalHeader/Title/Description/Footer/Close below are
 * shared by both paths unchanged: vaul's Content wraps a real
 * DialogPrimitive.Content under the hood, so DialogPrimitive.Title's
 * context lookup resolves correctly either way.
 */
export function Modal({ open, onOpenChange, children }: ModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm" />
          <Drawer.Content className="glass-panel fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl focus:outline-none">
            <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/25" aria-hidden="true" />
            <div className="relative overflow-y-auto p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              {children}
              <Drawer.Close asChild>
                <button
                  type="button"
                  aria-label="Închide"
                  className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </Drawer.Close>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              />
            </DialogPrimitive.Overlay>

            {/* Scrolling lives on this outer element, not the flex
                wrapper that centers the card: a single flex container
                that's both `items-center` and `overflow-y-auto` clips
                the top of its own overflow in some browsers once
                content is taller than the viewport (e.g. the mobile
                keyboard opening on a form field near the bottom of the
                card) -- min-h-full on the inner wrapper lets it grow
                past the viewport instead, so the outer scroll can
                always reach every edge of the card. */}
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <DialogPrimitive.Content asChild forceMount>
                  <motion.div
                    className="glass-panel w-full max-w-md rounded-2xl p-6 focus:outline-none"
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {children}
                    <DialogPrimitive.Close
                      className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Închide"
                    >
                      <X className="size-4" />
                    </DialogPrimitive.Close>
                  </motion.div>
                </DialogPrimitive.Content>
              </div>
            </div>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

export function ModalHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col gap-1.5 pr-6", className)} {...props} />;
}

export const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold tracking-tight text-foreground", className)}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

export const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ModalDescription.displayName = "ModalDescription";

export function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex items-center justify-end gap-3", className)} {...props} />;
}

export const ModalClose = DialogPrimitive.Close;
