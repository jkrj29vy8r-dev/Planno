"use client";

import * as React from "react";
import { Calendar, Clock, Mail, Phone, User } from "lucide-react";
import { Modal, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Planni } from "@/components/planni";
import { BookingStatusBadge } from "@/components/merchant/status-badge";
import { updateMerchantBookingStatusAction } from "@/lib/actions/merchant";
import { formatDateLong, formatPrice, formatTime } from "@/lib/format";
import type { CalendarBooking } from "@/lib/data/merchant";

interface BookingDetailModalProps {
  booking: CalendarBooking | null;
  timezone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function BookingDetailModal({ booking, timezone, open, onOpenChange, onUpdated }: BookingDetailModalProps) {
  const [step, setStep] = React.useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setStep("idle");
      setErrorMessage("");
    }
  }, [open]);

  if (!booking) return null;

  async function handleStatusChange(status: "confirmed" | "completed" | "no_show" | "cancelled") {
    setStep("loading");
    const result = await updateMerchantBookingStatusAction(booking!.id, status);
    if (result.error) {
      setErrorMessage(result.error);
      setStep("error");
      return;
    }
    onUpdated();
    onOpenChange(false);
  }

  const start = new Date(booking.start_time);
  const isActionable = booking.status === "pending" || booking.status === "confirmed";

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {step === "loading" ? (
        <div className="flex flex-col items-center py-6">
          <Planni state="loading" size={100} />
        </div>
      ) : step === "error" ? (
        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <Planni state="error" size={100} message={errorMessage} />
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setStep("idle")}>
            Înapoi
          </Button>
        </div>
      ) : (
        <>
          <ModalHeader>
            <div className="flex flex-wrap items-center gap-2">
              <ModalTitle>{booking.service.name}</ModalTitle>
              <BookingStatusBadge status={booking.status} />
            </div>
            <ModalDescription className="flex flex-col gap-1 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" /> {formatDateLong(start, timezone)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" /> {formatTime(start, timezone)} ·{" "}
                {formatPrice(booking.price, booking.currency)}
              </span>
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-2 rounded-lg border border-border/40 bg-muted/30 p-3.5 text-sm">
            <p className="flex items-center gap-1.5 font-medium">
              <User className="size-3.5" /> {booking.client.full_name}
            </p>
            {booking.client.email && (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="size-3.5" /> {booking.client.email}
              </p>
            )}
            {booking.client.phone && (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="size-3.5" /> {booking.client.phone}
              </p>
            )}
          </div>

          {booking.client_notes && (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Observații client: </span>
              {booking.client_notes}
            </p>
          )}

          {isActionable && (
            <ModalFooter className="flex-wrap justify-start gap-2 sm:justify-end">
              <Button variant="ghost" size="sm" onClick={() => handleStatusChange("cancelled")}>
                Anulează
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleStatusChange("no_show")}>
                Neprezentare
              </Button>
              {booking.status === "pending" && (
                <Button variant="secondary" size="sm" onClick={() => handleStatusChange("confirmed")}>
                  Confirmă
                </Button>
              )}
              <Button size="sm" onClick={() => handleStatusChange("completed")}>
                Finalizează
              </Button>
            </ModalFooter>
          )}
        </>
      )}
    </Modal>
  );
}
