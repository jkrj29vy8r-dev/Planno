import { Calendar, Coins, Star, Users } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { MerchantOverviewStats } from "@/lib/data/merchant";

interface OverviewStatsProps {
  stats: MerchantOverviewStats;
  rating: number | null;
  ratingCount: number;
}

function countTrend(current: number, previous: number, comparedTo: string): string {
  const diff = current - previous;
  if (diff === 0) return `La fel ca ${comparedTo}`;
  return `${diff > 0 ? "+" : ""}${diff} față de ${comparedTo}`;
}

function revenueTrend(current: number, previous: number, currency: string): string {
  const diff = Math.round(current - previous);
  if (diff === 0) return "La fel ca săptămâna trecută";
  const formatted = formatPrice(Math.abs(diff), currency);
  return `${diff > 0 ? "+" : "-"}${formatted} față de săptămâna trecută`;
}

/** The four v0-style overview cards, above the calendar. Every number
 *  and trend comes from real bookings/merchant data -- no card here
 *  invents a figure it can't back. */
export function OverviewStats({ stats, rating, ratingCount }: OverviewStatsProps) {
  const cards = [
    {
      label: "Rezervări azi",
      value: String(stats.bookingsToday),
      trend: countTrend(stats.bookingsToday, stats.bookingsYesterday, "ieri"),
      icon: Calendar,
    },
    {
      label: "Venit estimat",
      value: formatPrice(stats.revenueThisWeek, stats.revenueCurrency),
      trend: revenueTrend(stats.revenueThisWeek, stats.revenueLastWeek, stats.revenueCurrency),
      icon: Coins,
    },
    {
      label: "Clienți noi",
      value: String(stats.newClientsThisMonth),
      trend: countTrend(stats.newClientsThisMonth, stats.newClientsLastMonth, "luna trecută"),
      icon: Users,
    },
    {
      label: "Rating",
      value: rating !== null ? rating.toFixed(1) : "—",
      trend: ratingCount > 0 ? `${ratingCount} ${ratingCount === 1 ? "recenzie" : "recenzii"}` : "Fără recenzii încă",
      icon: Star,
    },
  ];

  return (
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
          <p className="mt-1 text-xs text-muted-foreground">{card.trend}</p>
        </div>
      ))}
    </div>
  );
}
