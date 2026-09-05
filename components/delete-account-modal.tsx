"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Planni } from "@/components/planni";
import { deactivateAccountAction } from "@/lib/actions/auth";

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMerchant: boolean;
}

export function DeleteAccountModal({ open, onOpenChange, isMerchant }: DeleteAccountModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);

  function handleConfirm() {
    setError("");
    startTransition(async () => {
      const result = await deactivateAccountAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/"), 1500);
    });
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {done ? (
        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <Planni state="success" size={110} message="Contul tău a fost dezactivat." />
        </div>
      ) : (
        <>
          <ModalHeader>
            <ModalTitle>Ștergi contul?</ModalTitle>
            <ModalDescription>
              Contul tău e dezactivat imediat și ești deconectat -- nu te vei mai putea autentifica
              {isMerchant ? ", iar afacerea ta nu va mai fi vizibilă public" : ""}. Istoricul
              rezervărilor rămâne intact, atât pentru tine cât și pentru{" "}
              {isMerchant ? "clienții tăi" : "comercianții la care ai rezervat"}.
            </ModalDescription>
          </ModalHeader>

          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

          <ModalFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Renunță
            </Button>
            <Button variant="destructive" onClick={handleConfirm} isLoading={isPending}>
              Da, șterge contul
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
