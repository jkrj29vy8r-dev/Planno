"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface LightboxProps {
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alt?: string;
}

/**
 * A dedicated full-bleed viewer, not the card-style Modal: Modal's
 * max-w-md center card exists for forms/confirmations, and would
 * either crop a photo or leave most of the screen as dead space around
 * a small centered image. Built directly on Radix's Dialog primitive
 * (already a dependency) for the same focus-trap/Escape/aria behavior
 * Modal gets from it, just with entirely different chrome.
 */
export function Lightbox({ images, index, onIndexChange, open, onOpenChange, alt = "" }: LightboxProps) {
  const goTo = React.useCallback(
    (next: number) => onIndexChange(((next % images.length) + images.length) % images.length),
    [images.length, onIndexChange],
  );

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") goTo(index - 1);
      else if (event.key === "ArrowRight") goTo(index + 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, index, goTo]);

  if (images.length === 0) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount onOpenAutoFocus={(e) => e.preventDefault()}>
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10"
                onClick={() => onOpenChange(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <DialogPrimitive.Title className="sr-only">
                  Fotografie {index + 1} din {images.length}
                </DialogPrimitive.Title>

                {/* Content itself covers the Overlay (it's a fullscreen
                    flex container, not a small centered box), so a plain
                    click-outside-to-close needs handling here -- Radix's
                    own overlay-click behavior never fires since nothing
                    can reach the Overlay underneath. Stopped here so
                    only the surrounding empty space closes it, not a
                    tap on the photo itself. */}
                <motion.img
                  key={images[index]}
                  src={images[index]}
                  alt={alt}
                  onClick={(e) => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="max-h-full max-w-full rounded-lg object-contain"
                />

                <DialogPrimitive.Close
                  aria-label="Închide"
                  className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <X className="size-5" aria-hidden="true" />
                </DialogPrimitive.Close>

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Fotografia anterioară"
                      onClick={(e) => {
                        e.stopPropagation();
                        goTo(index - 1);
                      }}
                      className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:left-4"
                    >
                      <ChevronLeft className="size-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Fotografia următoare"
                      onClick={(e) => {
                        e.stopPropagation();
                        goTo(index + 1);
                      }}
                      className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:right-4"
                    >
                      <ChevronRight className="size-5" aria-hidden="true" />
                    </button>
                    <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
                      {index + 1} / {images.length}
                    </p>
                  </>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
