"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Planni } from "@/components/planni";
import { StaffFormModal } from "@/components/merchant/staff-form-modal";
import { setStaffActiveAction } from "@/lib/actions/staff";
import type { StaffWithServiceIds } from "@/lib/data/staff";
import type { Tables } from "@/types/database.types";

export function StaffTable({
  merchantId,
  staff,
  services,
}: {
  merchantId: string;
  staff: StaffWithServiceIds[];
  services: Tables<"services">[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const serviceNameById = new Map(services.map((s) => [s.id, s.name]));

  async function toggleActive(member: StaffWithServiceIds) {
    setPendingId(member.id);
    await setStaffActiveAction(member.id, !member.is_active);
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Echipă</h1>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
          Adaugă specialist
        </Button>
      </div>

      {staff.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <Planni state="empty-state" size={120} message="" />
          <p className="text-sm text-muted-foreground">
            Niciun specialist adăugat încă. Clienții rezervă direct la afacerea ta.
          </p>
          <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}>
            Adaugă primul specialist
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/40 bg-muted/30 text-left text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Specialist</th>
                  <th className="px-4 py-3 font-medium">Servicii</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} className="border-b border-border/30 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt=""
                            className="size-9 shrink-0 rounded-full object-cover object-center"
                          />
                        ) : (
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{member.name}</p>
                          {member.title && <p className="truncate text-xs text-muted-foreground">{member.title}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-muted-foreground">
                      {member.serviceIds.length === 0 ? (
                        <span className="text-xs">Niciun serviciu asociat</span>
                      ) : (
                        <span className="line-clamp-1 text-xs">
                          {member.serviceIds.map((id) => serviceNameById.get(id) ?? "?").join(", ")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={pendingId === member.id}
                        onClick={() => toggleActive(member)}
                        className={
                          member.is_active
                            ? "rounded-full bg-accent/12 px-2.5 py-1 text-xs font-medium text-accent"
                            : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {member.is_active ? "Activ" : "Inactiv"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/merchant/dashboard/staff/${member.id}`}>
                        <Button variant="ghost" size="icon" aria-label="Editează">
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <StaffFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        merchantId={merchantId}
        services={services}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
