"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, ClipboardList, Clock, CreditCard, LayoutDashboard, Lock, LogOut, Scissors, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOutAction } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/merchant/dashboard", label: "Calendar", icon: Calendar, exact: true },
  { href: "/merchant/dashboard/bookings", label: "Programări", icon: ClipboardList, exact: false },
  { href: "/merchant/dashboard/services", label: "Servicii", icon: Scissors, exact: false },
  { href: "/merchant/dashboard/program", label: "Program", icon: Clock, exact: false },
  { href: "/merchant/dashboard/clients", label: "Clienți", icon: Users, exact: false },
  { href: "/merchant/dashboard/subscription", label: "Abonament", icon: CreditCard, exact: false },
];

export function MerchantSidebar({ businessName, locked = false }: { businessName: string; locked?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border/40 bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border/40 px-5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <LayoutDashboard className="size-4" />
        </span>
        <span className="truncate text-[15px] font-semibold tracking-tight">{businessName}</span>
      </div>

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

      <div className="flex items-center justify-between border-t border-border/40 px-5 py-4">
        <ThemeToggle />
        <button
          type="button"
          onClick={() => void signOutAction()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive"
        >
          <LogOut className="size-4" />
          Ieșire
        </button>
      </div>
    </aside>
  );
}
