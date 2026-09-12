"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { updateStaffAction } from "@/lib/actions/staff";
import type { Tables } from "@/types/database.types";

export function StaffEditForm({
  staff,
  services,
  initialServiceIds,
}: {
  staff: Tables<"staff_members">;
  services: Tables<"services">[];
  initialServiceIds: string[];
}) {
  const router = useRouter();
  const [name, setName] = React.useState(staff.name);
  const [title, setTitle] = React.useState(staff.title ?? "");
  const [bio, setBio] = React.useState(staff.bio ?? "");
  const [serviceIds, setServiceIds] = React.useState(initialServiceIds);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState("");

  function toggleService(serviceId: string) {
    setServiceIds((prev) => (prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]));
    setSaved(false);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Completează numele specialistului.");
      return;
    }

    setSaving(true);
    setError("");
    const result = await updateStaffAction(staff.id, {
      name: name.trim(),
      title: title.trim() || undefined,
      bio: bio.trim() || undefined,
      serviceIds,
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <Input
          label="Nume"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
        />
        <Input
          label="Titlu / rol (opțional)"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSaved(false);
          }}
        />
        <Input
          label="Descriere (opțional)"
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            setSaved(false);
          }}
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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} isLoading={saving}>
            {saved ? "Salvat" : "Salvează"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
