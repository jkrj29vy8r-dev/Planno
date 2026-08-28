"use client";

import * as React from "react";
import { Modal, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Planni } from "@/components/planni";
import { cn } from "@/lib/utils";
import { formatDateChip } from "@/lib/format";
import { formatTimeInZone, todayInZone } from "@/lib/timezone";
import { fetchAvailableSlotsAction } from "@/lib/actions/availability";
import { rescheduleBookingAction } from "@/lib/actions/bookings";
import type { BookingWithDetails } from "@/lib/data/bookings";

function nextDays(count: number, timezone: string): string[] {
  const today = todayInZone(timezone);
  const [y, m, d] = today.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(base);
    day.setUTCDate(base.getUTCDate() + i);
    return day.toISOString().slice(0, 10);
  });
}

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails;
  onRescheduled: () => void;
}

export function RescheduleModal({ open, onOpenChange, booking, onRescheduled }: RescheduleModalProps) {
  const timezone = booking.merchant.timezone;
  const dateOptions = React.useMemo(() => nextDays(7, timezone), [timezone]);

  const [selectedDate, setSelectedDate] = React.useState(dateOptions[0]);
  const [slots, setSlots] = React.useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  const loadSlots = React.useCallback(
    async (date: string) => {
      setSlotsLoading(true);
      setSelectedSlot(null);
      try {
        const result = await fetchAvailableSlotsAction({
          merchantId: booking.merchant.id,
          date,
          timezone,
          durationMinutes: booking.service.duration_minutes,
          workingHours: booking.merchant.working_hours,
        });
        setSlots(result);
      } finally {
        setSlotsLoading(false);
      }
    },
    [booking.merchant.id, booking.merchant.working_hours, booking.service.duration_minutes, timezone],
  );

  React.useEffect(() => {
    if (open) void loadSlots(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    void loadSlots(date);
  }

  async function handleConfirm() {
    if (!selectedSlot) return;
    setStep("loading");
    const result = await rescheduleBookingAction({ bookingId: booking.id, newStartTime: selectedSlot });

    if (result.error) {
      setErrorMessage(result.error);
      setStep("error");
      return;
    }
    setStep("success");
    onRescheduled();
    setTimeout(() => handleOpenChange(false), 1500);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setStep("idle");
      setSelectedSlot(null);
    }
    onOpenChange(next);
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      {step === "success" ? (
        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <Planni state="success" size={120} message="Programare mutată cu succes!" />
        </div>
      ) : step === "error" ? (
        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <Planni state="error" size={110} message={errorMessage} />
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setStep("idle")}>
            Încearcă din nou
          </Button>
        </div>
      ) : step === "loading" ? (
        <div className="flex flex-col items-center py-6">
          <Planni state="loading" size={110} />
        </div>
      ) : (
        <>
          <ModalHeader>
            <ModalTitle>Reprogramează</ModalTitle>
            <ModalDescription>
              {booking.service.name} · {booking.merchant.business_name}
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Alege o zi</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {dateOptions.map((date) => {
                  const chip = formatDateChip(new Date(`${date}T12:00:00Z`), timezone);
                  const isSelected = selectedDate === date;
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => handleSelectDate(date)}
                      className={cn(
                        "flex shrink-0 flex-col items-center gap-0.5 rounded-lg border px-3 py-2 text-xs transition-colors",
                        isSelected
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border/50 text-muted-foreground hover:bg-muted/60",
                      )}
                    >
                      <span>{chip.weekday}</span>
                      <span className="font-medium">{chip.day}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Alege o oră</p>
              {slotsLoading ? (
                <div className="flex justify-center py-4">
                  <Planni state="loading" size={72} message="" />
                </div>
              ) : slots.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border py-4 text-center text-sm text-muted-foreground">
                  Nicio oră liberă în această zi.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "rounded-lg border px-2 py-2 font-mono text-sm transition-colors",
                        selectedSlot === slot
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border/50 hover:bg-muted/60",
                      )}
                    >
                      {formatTimeInZone(new Date(slot), timezone)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <ModalFooter>
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              Renunță
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedSlot}>
              Confirmă noua oră
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
