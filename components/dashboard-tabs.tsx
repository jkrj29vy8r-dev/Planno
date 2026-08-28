"use client";

import * as React from "react";
import Link from "next/link";
import { Planni } from "@/components/planni";
import { BookingCard } from "@/components/booking-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookingWithDetails } from "@/lib/data/bookings";

interface DashboardTabsProps {
  upcoming: BookingWithDetails[];
  history: BookingWithDetails[];
}

export function DashboardTabs({ upcoming, history }: DashboardTabsProps) {
  const [tab, setTab] = React.useState<"upcoming" | "history">("upcoming");
  const items = tab === "upcoming" ? upcoming : history;

  return (
    <div>
      <div className="mb-6 flex gap-6 border-b border-border/40">
        <TabButton active={tab === "upcoming"} onClick={() => setTab("upcoming")} count={upcoming.length}>
          Viitoare
        </TabButton>
        <TabButton active={tab === "history"} onClick={() => setTab("history")} count={history.length}>
          Istoric
        </TabButton>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Planni state="empty-state" size={140} message="" />
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">
              {tab === "upcoming" ? "Nicio rezervare viitoare" : "Niciun istoric încă"}
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {tab === "upcoming"
                ? "Rezervările tale confirmate sau în așteptare apar aici."
                : "Rezervările finalizate sau anulate apar aici."}
            </p>
          </div>
          {tab === "upcoming" && (
            <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Descoperă comercianți
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((booking) => (
            <BookingCard key={booking.id} booking={booking} isUpcoming={tab === "upcoming"} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 pb-3 text-sm font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      <span className="text-xs text-muted-foreground">{count}</span>
      {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />}
    </button>
  );
}
