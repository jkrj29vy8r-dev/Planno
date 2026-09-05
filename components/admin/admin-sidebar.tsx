"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Shield, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarBackLink, SidebarFooter } from "@/components/merchant/merchant-sidebar";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/merchants", label: "Comercianți", icon: Store, exact: false },
];

function isNavItemActive(pathname: string, item: (typeof NAV_ITEMS)[number]): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/** Permanent sidebar at md: and up, same visual language as
 *  MerchantSidebar (same classes, same structure) so the two dashboard
 *  shells read as one design system rather than two. */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-border/40 bg-card md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border/40 px-5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Shield className="size-4" />
        </span>
        <span className="truncate text-[15px] font-semibold tracking-tight">Admin Planno</span>
      </div>

      <SidebarBackLink />

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isNavItemActive(pathname, item)
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <SidebarFooter />
    </aside>
  );
}

/** Mobile stand-in: admin is a desktop-first back office, so this is a
 *  plain top bar with inline links rather than a full slide-out drawer. */
export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border/40 bg-card md:hidden">
      <SidebarBackLink />
      <div className="flex items-center gap-2 px-5 py-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
          <Shield className="size-3.5" />
        </span>
        <span className="truncate text-sm font-semibold tracking-tight">Admin Planno</span>
        <nav className="ml-auto flex gap-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-xs font-medium transition-colors",
                isNavItemActive(pathname, item) ? "text-accent" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
