"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { SidebarFooter, SidebarNavLinks } from "@/components/merchant/merchant-sidebar";

interface MerchantMobileNavProps {
  businessName: string;
  locked?: boolean;
}

/**
 * Mobile equivalent of MerchantSidebar (md:hidden, the sidebar itself
 * is hidden below md:) -- a top bar with a hamburger trigger, and a
 * slide-out drawer sharing the sidebar's own nav list and footer so
 * the two can never show different links. Built on the same Radix
 * Dialog primitive Modal uses, just positioned as an edge panel
 * instead of a centered card.
 */
export function MerchantMobileNav({ businessName, locked = false }: MerchantMobileNavProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/40 bg-card px-4 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Deschide meniul"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <Menu className="size-5" />
        </button>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <LayoutDashboard className="size-4" />
        </span>
        <span className="truncate text-[15px] font-semibold tracking-tight">{businessName}</span>
      </header>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {open && (
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm md:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                />
              </DialogPrimitive.Overlay>

              <DialogPrimitive.Content asChild forceMount>
                <motion.div
                  className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col border-r border-border/40 bg-card focus:outline-none md:hidden"
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/40 px-4">
                    <DialogPrimitive.Title className="truncate text-[15px] font-semibold tracking-tight">
                      {businessName}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">
                      Meniu de navigare pentru panoul de comerciant
                    </DialogPrimitive.Description>
                    <DialogPrimitive.Close
                      aria-label="Închide meniul"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-4" />
                    </DialogPrimitive.Close>
                  </div>

                  <SidebarNavLinks locked={locked} onNavigate={() => setOpen(false)} />
                  <SidebarFooter />
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>
    </>
  );
}
