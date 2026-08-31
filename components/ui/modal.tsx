"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * Controlled dialog. The centering wrapper below is a plain flex div
 * (not a translate(-50%,-50%) utility) on purpose: framer-motion owns
 * the `transform` of the animated card for its enter/exit, and a
 * transform-based centering utility on that same element would fight
 * it and get silently overwritten every frame.
 */
export function Modal({ open, onOpenChange, children }: ModalProps) {
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
