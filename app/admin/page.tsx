import Link from "next/link";
import { Building2, Calendar, Users, Wallet } from "lucide-react";
import { getAdminOverviewStats, getRecentMerchants } from "@/lib/data/admin";
import { categoryLabel } from "@/lib/categories";
import { formatPrice, formatRelativeToNow } from "@/lib/format";
import { Planni } from "@/components/planni";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admin · Planno" };

export default async function AdminOverviewPage() {
  const [stats, recentMerchants] = await Promise.all([getAdminOverviewStats(), getRecentMerchants(6)]);

  const cards = [
    {
      label: "Utilizatori activi",
      value: stats.activeUsers.toLocaleString("ro-RO"),
      caption: "clienți și comercianți",
      icon: Users,
    },
    {
      label: "Comercianți",
      value: stats.merchantsCount.toLocaleString("ro-RO"),
      caption: `${stats.activeMerchantsCount} active acum`,
      icon: Building2,
    },
    {
      label: "Rezervări",
      value: stats.bookingsCount.toLocaleString("ro-RO"),
      caption: "confirmate sau finalizate",
      icon: Calendar,
    },
    {
      label: "Volum platformă",
      value: formatPrice(stats.platformVolume, stats.volumeCurrency),
      caption: "din rezervări confirmate",
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-6 px-6 py-8">
      <div>
        <p className="text-sm text-muted-foreground">Bun venit în centrul de control.</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Platforma, dintr-o privire.</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border/40 bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <card.icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.caption}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border/40 bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">Comercianți recenți</h2>
              <p className="text-sm text-muted-foreground">Cele mai noi afaceri de pe platformă.</p>
            </div>
            <Link href="/admin/merchants" className="shrink-0 text-sm font-medium text-accent hover:underline">
              Vezi toți →
            </Link>
          </div>

          {recentMerchants.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">Niciun comerciant încă.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border/40">
              {recentMerchants.map((merchant) => (
                <li key={merchant.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{merchant.businessName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {categoryLabel(merchant.category)}
                      {merchant.city ? ` · ${merchant.city}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={cn("text-xs", merchant.isActive ? "text-emerald-500" : "text-muted-foreground")}>
                      {merchant.isActive ? "Activ" : "Inactiv"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeToNow(new Date(merchant.createdAt))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/40 bg-card p-6 text-center">
          <Planni state="welcome" size={96} message="" />
          <div className="space-y-1">
            <h2 className="font-semibold text-foreground">Plani ține platforma sub observație.</h2>
            <p className="text-sm text-muted-foreground">
              {stats.bookingsCount.toLocaleString("ro-RO")} rezervări procesate pe{" "}
              {stats.merchantsCount.toLocaleString("ro-RO")} comercianți.
            </p>
          </div>
          <Link href="/admin/merchants" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
            Vezi comercianții
          </Link>
        </div>
      </div>
    </div>
  );
}
