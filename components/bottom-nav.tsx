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
 * Mobile-only (lg:hidden) fixed bottom bar -- the desktop equivalent is
 * the same 4 destinations added to SiteHeader's top navbar. Deliberately
 * dark chrome regardless of the site's own light/dark theme, matching
 * WelcomeToast's reasoning: a persistent native-app tab bar reads as one
 * fixed piece of chrome, not page content that should flip with theme.
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const isActive = pathname === item.href.split("#")[0].split("?")[0];
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                isActive ? "text-accent" : "text-white/60 hover:text-white/85",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-5" strokeWidth={isActive ? 2.25 : 1.8} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
