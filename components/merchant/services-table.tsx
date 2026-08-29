"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Planni } from "@/components/planni";
import { ServiceFormModal } from "@/components/merchant/service-form-modal";
import { setServiceActiveAction } from "@/lib/actions/merchant";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Tables } from "@/types/database.types";

export function ServicesTable({ merchantId, services }: { merchantId: string; services: Tables<"services">[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Tables<"services"> | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  function openCreate() {
    setEditingService(null);
    setModalOpen(true);
  }

  function openEdit(service: Tables<"services">) {
    setEditingService(service);
    setModalOpen(true);
  }

  async function toggleActive(service: Tables<"services">) {
    setPendingId(service.id);
    await setServiceActiveAction(service.id, !service.is_active);
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Servicii</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Adaugă serviciu
        </Button>
      </div>

      {services.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <Planni state="empty-state" size={120} message="" />
          <p className="text-sm text-muted-foreground">Niciun serviciu adăugat încă.</p>
          <Button size="sm" variant="outline" onClick={openCreate}>
            Adaugă primul serviciu
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/40 bg-muted/30 text-left text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Serviciu</th>
                  <th className="px-4 py-3 font-medium">Durată</th>
                  <th className="px-4 py-3 font-medium">Preț</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b border-border/30 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{service.name}</p>
                      {service.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{service.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDuration(service.duration_minutes)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono">{formatPrice(service.price, service.currency)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={pendingId === service.id}
                        onClick={() => toggleActive(service)}
                        className={
                          service.is_active
                            ? "rounded-full bg-accent/12 px-2.5 py-1 text-xs font-medium text-accent"
                            : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {service.is_active ? "Activ" : "Inactiv"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" aria-label="Editează" onClick={() => openEdit(service)}>
                        <Pencil className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ServiceFormModal open={modalOpen} onOpenChange={setModalOpen} merchantId={merchantId} service={editingService} onSaved={() => router.refresh()} />
    </div>
  );
}
