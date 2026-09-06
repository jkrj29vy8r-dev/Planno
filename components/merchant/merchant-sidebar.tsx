"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Calendar, ClipboardList, Clock, CreditCard, LayoutDashboard, Lock, LogOut, Scissors, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOutAction } from "@/lib/actions/auth";

export const NAV_ITEMS = [
  { href: "/merchant/dashboard", label: "Calendar", icon: Calendar, exact: true },
  { href: "/merchant/dashboard/bookings", label: "Programări", icon: ClipboardList, exact: false },
  { href: "/merchant/dashboard/services", label: "Servicii", icon: Scissors, exact: false },
  { href: "/merchant/dashboard/program", label: "Program", icon: Clock, exact: false },
  { href: "/merchant/dashboard/clients", label: "Clienți", icon: Users, exact: false },
  { href: "/merchant/dashboard/profile", label: "Profil", icon: Store, exact: false },
  { href: "/merchant/dashboard/subscription", label: "Abonament", icon: CreditCard, exact: false },
];

/** Exit hatch back to the consumer site -- shared by the desktop
 *  sidebar and the mobile drawer so there's always a way out of the
 *  merchant area, not just deeper into it. Visually separated from
 *  NAV_ITEMS below (its own bottom border) since it leaves the
 *  section rather than navigating within it. */
export function SidebarBackLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="border-b border-border/40 px-3 pt-3 pb-2">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Înapoi la Planno
      </Link>
    </div>
  );
}

/** The nav item list itself, shared by the permanent desktop sidebar
 *  and the mobile drawer (MerchantMobileNav) so the two can never drift
 *  out of sync. `onNavigate` is how the mobile drawer closes itself on
 *  a link tap -- the desktop sidebar leaves it unset. */
export function SidebarNavLinks({ locked, onNavigate }: { locked: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

        // While locked every route renders the paywall anyway, so the
        // links are shown inert rather than pretending to navigate.
        if (locked) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/40"
            >
              <item.icon className="size-4" />
              {item.label}
              <Lock className="ml-auto size-3.5" />
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The footer row (theme toggle + sign out), also shared by the
 *  desktop sidebar and the mobile drawer. */
export function SidebarFooter() {
  return (
    <div className="flex items-center justify-between border-t border-border/40 px-5 py-4">
      <ThemeToggle />
      <button
        type="button"
        onClick={() => {
          // Hard navigation, not router.push: guarantees a fresh
          // request with the now-cleared session cookie, so there's no
          // race with this protected dashboard's own re-render.
          void signOutAction().then(() => {
            window.location.href = "/";
          });
        }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive"
      >
        <LogOut className="size-4" />
        Ieșire
      </button>
    </div>
  );
}

/** Permanent sidebar at md: and up. Hidden entirely below that --
 *  MerchantMobileNav is the mobile equivalent, a slide-out drawer
 *  rather than a fixed column, so the dashboard's content can use the
 *  full screen width on a phone instead of being squeezed beside a
 *  240px column it has no room for. */
export function MerchantSidebar({ businessName, locked = false }: { businessName: string; locked?: boolean }) {
  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-border/40 bg-card md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border/40 px-5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <LayoutDashboard className="size-4" />
        </span>
        <span className="truncate text-[15px] font-semibold tracking-tight">{businessName}</span>
      </div>

      <SidebarBackLink />
      <SidebarNavLinks locked={locked} />
      <SidebarFooter />
    </aside>
  );
}
