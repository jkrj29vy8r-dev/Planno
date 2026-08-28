"use client";

import * as React from "react";
import { Modal, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Planni } from "@/components/planni";
import { cancelBookingAction } from "@/lib/actions/bookings";
import type { BookingWithDetails } from "@/lib/data/bookings";

interface CancelBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails;
  onCancelled: () => void;
}

export function CancelBookingModal({ open, onOpenChange, booking, onCancelled }: CancelBookingModalProps) {
  const [reason, setReason] = React.useState("");
  const [step, setStep] = React.useState<"confirm" | "loading" | "success" | "error">("confirm");
  const [errorMessage, setErrorMessage] = React.useState("");

  async function handleConfirm() {
    setStep("loading");
    const result = await cancelBookingAction(booking.id, reason || undefined);

    if (result.error) {
      setErrorMessage(result.error);
      setStep("error");
      return;
    }
    setStep("success");
    onCancelled();
    setTimeout(() => handleOpenChange(false), 1500);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setStep("confirm");
      setReason("");
    }
    onOpenChange(next);
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      {step === "success" ? (
        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <Planni state="success" size={110} message="Rezervarea a fost anulată." />
        </div>
      ) : step === "error" ? (
        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <Planni state="error" size={110} message={errorMessage} />
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setStep("confirm")}>
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
            <ModalTitle>Anulează rezervarea?</ModalTitle>
            <ModalDescription>
              {booking.service.name} · {booking.merchant.business_name}. Această acțiune nu poate fi
              anulată.
            </ModalDescription>
          </ModalHeader>

          <Input
            label="Motiv (opțional)"
            placeholder="Spune-ne de ce anulezi..."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />

          <ModalFooter>
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              Renunță
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Anulează rezervarea
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
