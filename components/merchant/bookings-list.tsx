"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Planni } from "@/components/planni";
import { BookingStatusBadge } from "@/components/merchant/status-badge";
import { updateMerchantBookingStatusAction } from "@/lib/actions/merchant";
import { formatDateShort, formatPrice, formatTime } from "@/lib/format";
import { addDays } from "@/lib/merchant-calendar";
import { dateKeyInZone, todayInZone } from "@/lib/timezone";
import type { CalendarBooking } from "@/lib/data/merchant";

type Filter = "azi" | "maine" | "toate";

const EMPTY_COPY: Record<Filter, string> = {
  azi: "Nicio programare azi.",
  maine: "Nicio programare mâine.",
  toate: "Nicio programare încă.",
};

export function BookingsList({ bookings, timezone }: { bookings: CalendarBooking[]; timezone: string }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("azi");
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const today = todayInZone(timezone);
  const tomorrow = addDays(today, 1);

  const filtered = React.useMemo(() => {
    if (filter === "toate") return bookings;
    const targetKey = filter === "azi" ? today : tomorrow;
    return bookings.filter((b) => dateKeyInZone(new Date(b.start_time), timezone) === targetKey);
  }, [bookings, filter, today, tomorrow, timezone]);

  async function changeStatus(bookingId: string, status: "confirmed" | "completed" | "cancelled") {
    setPendingId(bookingId);
    await updateMerchantBookingStatusAction(bookingId, status);
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Programări</h1>

      <Tabs
        items={[
          { id: "azi", label: "Azi", count: countForKey(bookings, today, timezone) },
          { id: "maine", label: "Mâine", count: countForKey(bookings, tomorrow, timezone) },
          { id: "toate", label: "Toate", count: bookings.length },
        ]}
        active={filter}
        onChange={(id) => setFilter(id as Filter)}
      />

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <Planni state="empty-state" size={120} message="" />
          <p className="text-sm text-muted-foreground">{EMPTY_COPY[filter]}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          {/* Stacked cards below md -- a table's status/action columns are
              the whole point of this screen, so pushing them off-screen
              behind a silent horizontal scroll (as the plain table below
              does on a phone) isn't acceptable here. */}
          <div className="divide-y divide-border/30 md:hidden">
            {filtered.map((booking) => {
              const start = new Date(booking.start_time);
              return (
                <div key={booking.id} className="space-y-2.5 px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{booking.client.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {booking.service.name} · {formatPrice(booking.price, booking.currency)}
                      </p>
                    </div>
                    <BookingStatusBadge status={booking.status} className="shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateShort(start, timezone)} · {formatTime(start, timezone)}
                  </p>
                  <RowActions booking={booking} busy={pendingId === booking.id} onChange={changeStatus} />
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border/40 bg-muted/30 text-left text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Serviciu</th>
                  <th className="px-4 py-3 font-medium">Data și ora</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => {
                  const start = new Date(booking.start_time);

                  return (
                    <tr key={booking.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{booking.client.full_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {booking.service.name}
                        <span className="ml-1.5 text-xs">{formatPrice(booking.price, booking.currency)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {formatDateShort(start, timezone)} · {formatTime(start, timezone)}
                      </td>
                      <td className="px-4 py-3">
                        <BookingStatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RowActions
                          booking={booking}
                          busy={pendingId === booking.id}
                          onChange={changeStatus}
                          align="end"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function countForKey(bookings: CalendarBooking[], dateKey: string, timezone: string): number {
  return bookings.filter((b) => dateKeyInZone(new Date(b.start_time), timezone) === dateKey).length;
}

interface RowActionsProps {
  booking: CalendarBooking;
  busy: boolean;
  onChange: (bookingId: string, status: "confirmed" | "completed" | "cancelled") => void;
  align?: "start" | "end";
}

function RowActions({ booking, busy, onChange, align = "start" }: RowActionsProps) {
  const isPending = booking.status === "pending";
  if (!isPending && booking.status !== "confirmed") return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${align === "end" ? "justify-end" : ""}`}>
      {isPending && (
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => onChange(booking.id, "confirmed")}>
          Confirmă
        </Button>
      )}
      <Button variant="ghost" size="sm" disabled={busy} onClick={() => onChange(booking.id, "cancelled")}>
        Anulează
      </Button>
      <Button size="sm" disabled={busy} onClick={() => onChange(booking.id, "completed")}>
        Finalizează
      </Button>
    </div>
  );
}
