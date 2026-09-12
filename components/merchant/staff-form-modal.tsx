"use client";

import * as React from "react";
import { Modal, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Planni } from "@/components/planni";
import { createStaffAction, type StaffInput } from "@/lib/actions/staff";
import type { Tables } from "@/types/database.types";

interface StaffFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantId: string;
  services: Tables<"services">[];
  onCreated: () => void;
}

/**
 * Create-only -- unlike ServiceFormModal, there's no edit mode here.
 * Avatar/galerie/program need a staffId to upload against, so editing
 * an existing specialist happens on its own page
 * (/merchant/dashboard/staff/[id]) instead of cramming every field
 * (including two image uploaders) into one modal.
 */
export function StaffFormModal({ open, onOpenChange, merchantId, services, onCreated }: StaffFormModalProps) {
  const [name, setName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [serviceIds, setServiceIds] = React.useState<string[]>([]);
  const [step, setStep] = React.useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setName("");
      setTitle("");
      setBio("");
      setServiceIds([]);
      setStep("idle");
      setErrorMessage("");
    }
  }, [open]);

  function toggleService(serviceId: string) {
    setServiceIds((prev) => (prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Completează numele specialistului.");
      setStep("error");
      return;
    }

    setStep("loading");
    const input: StaffInput = {
      name: name.trim(),
      title: title.trim() || undefined,
      bio: bio.trim() || undefined,
      serviceIds,
    };

    const result = await createStaffAction(merchantId, input);

    if (result.error) {
      setErrorMessage(result.error);
      setStep("error");
      return;
    }

    onCreated();
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
            <ModalTitle>Specialist nou</ModalTitle>
          </ModalHeader>

          <Input label="Nume" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Răzvan Popescu" />
          <Input
            label="Titlu / rol (opțional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Coafor senior"
          />
          <Input
            label="Descriere (opțional)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Câteva cuvinte despre specialist..."
          />

          {services.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/90">Servicii pe care le poate efectua</label>
              <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-lg border border-input p-1.5">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                  >
                    <input
                      type="checkbox"
                      checked={serviceIds.includes(service.id)}
                      onChange={() => toggleService(service.id)}
                      className="size-4 rounded border-input accent-accent"
                    />
                    {service.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === "error" && <p className="text-sm text-destructive">{errorMessage}</p>}

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Anulează
            </Button>
            <Button type="submit">Adaugă specialistul</Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
