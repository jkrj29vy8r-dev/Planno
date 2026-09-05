"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { DeleteAccountModal } from "@/components/delete-account-modal";

export function DeleteAccountSection({ isMerchant }: { isMerchant: boolean }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="mt-8 rounded-2xl border border-destructive/20 p-5">
      <h2 className="text-sm font-semibold text-foreground">Zonă periculoasă</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Odată dezactivat, contul nu mai poate fi folosit pentru autentificare.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex items-center gap-2 text-sm font-medium text-destructive transition-colors hover:text-destructive/80"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Șterge contul
      </button>

      <DeleteAccountModal open={open} onOpenChange={setOpen} isMerchant={isMerchant} />
    </div>
  );
}
