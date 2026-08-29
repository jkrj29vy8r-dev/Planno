"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/merchant/status-badge";
import { updateMerchantBookingStatusAction } from "@/lib/actions/merchant";
import { formatDateLong, formatPrice, formatTime } from "@/lib/format";
import type { CalendarBooking } from "@/lib/data/merchant";

export function ClientHistoryTable({ bookings, timezone }: { bookings: CalendarBooking[]; timezone: string }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function handleStatusChange(bookingId: string, status: "confirmed" | "completed" | "no_show" | "cancelled") {
    setPendingId(bookingId);
    await updateMerchantBookingStatusAction(bookingId, status);
    setPendingId(null);
    router.refresh();
  }

  return (
    <Card className="divide-y divide-border/40 p-0">
      {bookings.map((booking) => {
        const start = new Date(booking.start_time);
        const isActionable = booking.status === "pending" || booking.status === "confirmed";
        const isPending = pendingId === booking.id;

        return (
          <div key={booking.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{booking.service.name}</p>
                <BookingStatusBadge status={booking.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDateLong(start, timezone)} · {formatTime(start, timezone)} · {formatPrice(booking.price, booking.currency)}
              </p>
              {booking.cancellation_reason && (
                <p className="text-xs text-muted-foreground">Motiv: {booking.cancellation_reason}</p>
              )}
            </div>

            {isActionable && (
              <div className="flex flex-wrap gap-2">
                {booking.status === "pending" && (
                  <Button size="sm" variant="secondary" disabled={isPending} onClick={() => handleStatusChange(booking.id, "confirmed")}>
                    Confirmă
                  </Button>
                )}
                <Button size="sm" disabled={isPending} onClick={() => handleStatusChange(booking.id, "completed")}>
                  Finalizează
                </Button>
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleStatusChange(booking.id, "no_show")}>
                  Neprezentare
                </Button>
                <Button size="sm" variant="ghost" disabled={isPending} onClick={() => handleStatusChange(booking.id, "cancelled")}>
                  Anulează
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}
