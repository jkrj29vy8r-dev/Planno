"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";

/** Desktop's "transformed" presentation of the same navigation as
 *  BottomNav -- an airy horizontal link row instead of a fixed bar,
 *  same 4 destinations from the same source list. */
export function DesktopNavLinks({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigare principală" className="hidden items-center gap-1 lg:flex">
      {navItems(isAuthenticated).map((item) => {
        const isActive = pathname === item.href.split("#")[0].split("?")[0];
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              isActive ? "text-accent" : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
