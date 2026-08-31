"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Home, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  isAuthenticated: boolean;
}

/** Shared with DesktopNavLinks so both responsive presentations of the
 *  same navigation always point at the same 4 destinations. */
export function navItems(isAuthenticated: boolean) {
  return [
    { id: "home", href: "/", label: "Acasă", icon: Home },
    { id: "search", href: "/#rezultate", label: "Căutare", icon: Search },
    {
      id: "bookings",
      href: isAuthenticated ? "/client/dashboard" : "/login?redirect=/client/dashboard",
      label: "Programări",
      icon: CalendarCheck,
    },
    { id: "account", href: isAuthenticated ? "/account" : "/login", label: "Cont", icon: User },
  ];
}

/**
 * Shared with DesktopNavLinks. Two things a naive comparison gets
 * wrong, both of which used to light up two items at once:
 *
 * - usePathname() never reports the hash, so an in-page anchor like
 *   "/#rezultate" is indistinguishable from "/" and must never claim
 *   the active state -- otherwise it and the real "/" item (Acasă)
 *   would both light up together on the home page.
 * - When logged out, "Programări" and "Cont" both route through
 *   /login ("/login?redirect=/client/dashboard" and "/login"). Matching
 *   on the pathname alone (stripping the query) made both resolve to
 *   the same /login and light up together on the login page. Comparing
 *   the full href instead fixes this correctly rather than
 *   coincidentally: /login *is* Cont's real unauthenticated
 *   destination, but it's merely a waypoint for Programări, whose own
 *   href is the longer redirect string -- so only Cont should ever
 *   claim it.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href.includes("#")) return false;
  return pathname === href;
}

/**
 * Mobile-only (md:hidden) floating pill -- the desktop equivalent is
 * the same 4 destinations added to SiteHeader's top navbar at md: and up
 * (DesktopNavLinks), so the two stay complementary with no gap where
 * neither shows. Deliberately dark chrome regardless of the site's own
 * light/dark theme, matching WelcomeToast's reasoning: a persistent
 * native-app tab bar reads as one fixed piece of chrome, not page
 * content that should flip with theme.
 */
export function BottomNav({ isAuthenticated }: BottomNavProps) {
  const pathname = usePathname();
  const items = navItems(isAuthenticated);

  React.useEffect(() => {
    console.log("[Navigare] Route changed", { pathname });
  }, [pathname]);

  return (
    <nav
      aria-label="Navigare principală"
      className="fixed inset-x-0 z-40 flex justify-center px-4 md:hidden"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div className="flex w-full max-w-sm items-center justify-around rounded-full border border-white/10 bg-zinc-900/85 p-2 shadow-2xl backdrop-blur-lg">
        {items.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-full px-3 py-1 transition-all duration-200",
                isActive ? "text-orange-500" : "text-zinc-400 hover:text-white",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="mb-0.5 size-5" aria-hidden="true" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && <span className="mt-0.5 size-1 rounded-full bg-orange-500" aria-hidden="true" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
