"use client";

import { CalendarPlus, CheckCircle2 } from "lucide-react";
import { Modal, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { buildGoogleCalendarUrl } from "@/lib/calendar-link";
import { formatDateLong, formatTime } from "@/lib/format";

interface BookingSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookAnother: () => void;
  serviceName: string;
  merchantName: string;
  merchantAddress?: string | null;
  merchantCity?: string | null;
  startTime: Date;
  endTime: Date;
  timezone: string;
}

/**
 * Shown once createBookingAction has actually succeeded (this modal
 * never opens on its own -- BookingPanel controls that), so everything
 * here describes a booking that's already a real row in `bookings`.
 * The calendar link is a plain Google "quick add" template URL, not an
 * API call: no OAuth/Calendar-API scope to request, it just opens
 * pre-filled in whatever Google account the user is signed into.
 */
export function BookingSuccessModal({
  open,
  onOpenChange,
  onBookAnother,
  serviceName,
  merchantName,
  merchantAddress,
  merchantCity,
  startTime,
  endTime,
  timezone,
}: BookingSuccessModalProps) {
  const location = [merchantAddress, merchantCity].filter(Boolean).join(", ") || undefined;
  const calendarUrl = buildGoogleCalendarUrl({
    title: `${serviceName} · ${merchantName}`,
    start: startTime,
    end: endTime,
    details: `Programare la ${merchantName} prin Planno.`,
    location,
  });

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <div className="mb-2 flex justify-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="size-6 text-accent" aria-hidden="true" />
        </div>
      </div>

      <ModalHeader className="items-center text-center">
        <ModalTitle>Rezervare confirmată!</ModalTitle>
        <p className="text-sm text-muted-foreground">
          {serviceName} la {merchantName}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDateLong(startTime, timezone)} · {formatTime(startTime, timezone)}
        </p>
      </ModalHeader>

      <a
        href={calendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2")}
      >
        <CalendarPlus className="size-4" aria-hidden="true" />
        Adaugă în Google Calendar
      </a>

      <ModalFooter className="mt-4 sm:justify-center">
        <Button variant="ghost" size="sm" onClick={onBookAnother}>
          Fă o altă rezervare
        </Button>
      </ModalFooter>
    </Modal>
  );
}
