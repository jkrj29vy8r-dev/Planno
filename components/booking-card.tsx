"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RescheduleModal } from "@/components/reschedule-modal";
import { CancelBookingModal } from "@/components/cancel-booking-modal";
import { LeaveReviewModal } from "@/components/leave-review-modal";
import { cn } from "@/lib/utils";
import { formatBookingStatus, formatDateLong, formatPrice, formatTime } from "@/lib/format";
import type { BookingWithDetails } from "@/lib/data/bookings";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-accent/15 text-accent",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export function BookingCard({
  booking,
  isUpcoming,
  hasReview = false,
}: {
  booking: BookingWithDetails;
  isUpcoming: boolean;
  hasReview?: boolean;
}) {
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [justReviewed, setJustReviewed] = React.useState(false);
  const start = new Date(booking.start_time);
  // Matches reviews_insert_own_completed_booking: a merchant explicitly
  // marking a booking 'completed' always qualifies, and so does a
  // confirmed booking once its time has passed (isUpcoming already
  // encodes that -- see getUpcomingBookings/getBookingHistory) even if
  // no one ever flipped its status.
  const canReview =
    (booking.status === "completed" || (!isUpcoming && booking.status === "confirmed")) &&
    !hasReview &&
    !justReviewed;

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/merchants/${booking.merchant.slug}`}
                className="font-medium hover:text-accent"
              >
                {booking.merchant.business_name}
              </Link>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  STATUS_STYLES[booking.status],
                )}
              >
                {formatBookingStatus(booking.status)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{booking.service.name}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {formatDateLong(start, booking.merchant.timezone)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {formatTime(start, booking.merchant.timezone)}
              </span>
              <span className="font-mono">{formatPrice(booking.price, booking.currency)}</span>
            </div>
            {booking.status === "cancelled" && booking.cancellation_reason && (
              <p className="text-xs text-muted-foreground">
                Motiv: {booking.cancellation_reason}
              </p>
            )}
          </div>

          {isUpcoming ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setRescheduleOpen(true)}>
                Reprogramează
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCancelOpen(true)}>
                Anulează
              </Button>
            </div>
          ) : canReview ? (
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => setReviewOpen(true)}>
              <Star className="size-3.5" aria-hidden="true" />
              Lasă o recenzie
            </Button>
          ) : (
            (hasReview || justReviewed) &&
            booking.status === "completed" && (
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Star className="size-3.5 fill-current" aria-hidden="true" />
                Recenzie trimisă
              </span>
            )
          )}
        </CardContent>
      </Card>

      {isUpcoming && (
        <>
          <RescheduleModal
            open={rescheduleOpen}
            onOpenChange={setRescheduleOpen}
            booking={booking}
            onRescheduled={() => {}}
          />
          <CancelBookingModal
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            booking={booking}
            onCancelled={() => {}}
          />
        </>
      )}

      {canReview && (
        <LeaveReviewModal
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          booking={booking}
          onSubmitted={() => setJustReviewed(true)}
        />
      )}
    </>
  );
}
