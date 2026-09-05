"use client";

import * as React from "react";
import { Modal, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Planni } from "@/components/planni";
import { createServiceAction, updateServiceAction, type ServiceInput } from "@/lib/actions/merchant";
import type { Tables } from "@/types/database.types";

interface ServiceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantId: string;
  service?: Tables<"services"> | null;
  onSaved: () => void;
}

export function ServiceFormModal({ open, onOpenChange, merchantId, service, onSaved }: ServiceFormModalProps) {
  const isEdit = Boolean(service);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [duration, setDuration] = React.useState("");
  const [step, setStep] = React.useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setName(service?.name ?? "");
      setDescription(service?.description ?? "");
      setPrice(service ? String(service.price) : "");
      setDuration(service ? String(service.duration_minutes) : "");
      setStep("idle");
      setErrorMessage("");
    }
  }, [open, service]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const priceValue = Number(price);
    const durationValue = Number(duration);

    if (
      !name.trim() ||
      !Number.isFinite(priceValue) ||
      priceValue < 0 ||
      !Number.isInteger(durationValue) ||
      durationValue <= 0
    ) {
      setErrorMessage("Completează un nume, un preț valid și o durată în minute.");
      setStep("error");
      return;
    }

    setStep("loading");
    const input: ServiceInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: priceValue,
      durationMinutes: durationValue,
    };

    const result = isEdit && service ? await updateServiceAction(service.id, input) : await createServiceAction(merchantId, input);

    if (result.error) {
      setErrorMessage(result.error);
      setStep("error");
      return;
    }

    onSaved();
    onOpenChange(false);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {step === "loading" ? (
        <div className="flex flex-col items-center py-6">
          <Planni state="loading" size={100} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ModalHeader>
            <ModalTitle>{isEdit ? "Editează serviciul" : "Serviciu nou"}</ModalTitle>
          </ModalHeader>

          <Input label="Nume serviciu" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tuns și styling" />
          <Input
            label="Descriere (opțional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalii despre serviciu..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Preț (RON)" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            <Input
              label="Durată (minute)"
              type="number"
              min="1"
              step="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {step === "error" && <p className="text-sm text-destructive">{errorMessage}</p>}

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Anulează
            </Button>
            <Button type="submit">{isEdit ? "Salvează" : "Adaugă serviciul"}</Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
