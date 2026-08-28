"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Radix mounts/unmounts DropdownMenu.Content based on its own internal
 * open state, which AnimatePresence can't see -- so framer-motion's
 * `exit` would never fire. This context re-exposes that open state so
 * DropdownContent can drive its own AnimatePresence + forceMount,
 * mirroring how Modal is wired.
 */
const DropdownOpenContext = React.createContext(false);

export interface DropdownProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root> {}

export function Dropdown({ open, defaultOpen, onOpenChange, ...props }: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : uncontrolledOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <DropdownOpenContext.Provider value={currentOpen}>
      <DropdownMenuPrimitive.Root open={currentOpen} onOpenChange={handleOpenChange} {...props} />
    </DropdownOpenContext.Provider>
  );
}

export const DropdownTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownGroup = DropdownMenuPrimitive.Group;

export interface DropdownContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {}

export const DropdownContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownContentProps
>(({ className, sideOffset = 8, align = "end", children, ...props }, ref) => {
  const open = React.useContext(DropdownOpenContext);

  return (
    <AnimatePresence>
      {open && (
        <DropdownMenuPrimitive.Portal forceMount>
          <DropdownMenuPrimitive.Content
            ref={ref}
            forceMount
            sideOffset={sideOffset}
            align={align}
            asChild
            {...props}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "glass-panel z-50 min-w-[12rem] overflow-hidden rounded-xl p-1.5",
                className,
              )}
            >
              {children}
            </motion.div>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      )}
    </AnimatePresence>
  );
});
DropdownContent.displayName = "DropdownContent";

export interface DropdownItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  icon?: React.ReactNode;
  destructive?: boolean;
}

export const DropdownItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownItemProps
>(({ className, icon, destructive, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors",
      "focus:bg-muted focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      destructive
        ? "text-destructive focus:bg-destructive/10 focus:text-destructive"
        : "text-foreground/90",
      className,
    )}
    {...props}
  >
    {icon && (
      <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">
        {icon}
      </span>
    )}
    {children}
  </DropdownMenuPrimitive.Item>
));
DropdownItem.displayName = "DropdownItem";

export const DropdownSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("my-1.5 h-px bg-border/60", className)}
    {...props}
  />
));
DropdownSeparator.displayName = "DropdownSeparator";

export const DropdownLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-2.5 py-1.5 text-xs font-medium text-muted-foreground", className)}
    {...props}
  />
));
DropdownLabel.displayName = "DropdownLabel";
