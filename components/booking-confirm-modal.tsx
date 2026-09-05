"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Modal, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateContactInfoAction } from "@/lib/actions/auth";

interface BookingConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: string;
  initialFullName: string;
  initialPhone: string;
  onConfirmed: () => void;
}

/**
 * Collects/confirms the client's name and phone right before the
 * booking is created, and persists them to their profile -- phone in
 * particular is never asked for at sign-up, so for most clients this
 * is the first time it gets set. The merchant dashboard already reads
 * and displays profiles.phone in several places; this is what fills
 * it. Actual booking creation stays owned by BookingPanel (via
 * onConfirmed), which already has its own loading/success/error UI.
 */
export function BookingConfirmModal({
  open,
  onOpenChange,
  summary,
  initialFullName,
  initialPhone,
  onConfirmed,
}: BookingConfirmModalProps) {
  const [fullName, setFullName] = React.useState(initialFullName);
  const [phone, setPhone] = React.useState(initialPhone);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  // Re-sync if the modal is reopened after the underlying profile
  // values changed (e.g. a previous save on a different booking).
  React.useEffect(() => {
    if (open) {
      setFullName(initialFullName);
      setPhone(initialPhone);
      setError("");
    }
  }, [open, initialFullName, initialPhone]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const result = await updateContactInfoAction({ fullName, phone });
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      onConfirmed();
    } catch {
      // A thrown network/connection failure, not a structured
      // {error} response -- without this the button would stay
      // stuck spinning with no feedback.
      setError("Nu am putut salva datele de contact. Verifică conexiunea și încearcă din nou.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <div className="mb-2 flex justify-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="size-6 text-accent" aria-hidden="true" />
        </div>
      </div>

      <ModalHeader className="items-center text-center">
        <ModalTitle>Confirmă programarea</ModalTitle>
        <p className="text-xs text-muted-foreground">{summary}</p>
      </ModalHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nume complet"
          placeholder="ex: Alex Popa"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        <Input
          label="Număr de telefon"
          type="tel"
          placeholder="07xx xxx xxx"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <ModalFooter className="mt-2">
          <Button type="submit" className="w-full" isLoading={saving}>
            Confirmă și rezervă
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
