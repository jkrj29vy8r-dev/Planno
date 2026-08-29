"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateWorkingHoursAction } from "@/lib/actions/merchant";
import { DAY_KEYS, DAY_LABELS, type DayHours, type WorkingHours } from "@/lib/working-hours";
import type { Json } from "@/types/database.types";

export function WorkingHoursEditor({ merchantId, workingHours }: { merchantId: string; workingHours: WorkingHours }) {
  const [hours, setHours] = React.useState<WorkingHours>(workingHours);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState("");

  function updateDay(day: keyof WorkingHours, patch: Partial<DayHours>) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
    setSaved(false);
  }

  function addBreak(day: keyof WorkingHours) {
    const current = hours[day].breaks ?? [];
    updateDay(day, { breaks: [...current, { start: "13:00", end: "14:00" }] });
  }

  function updateBreak(day: keyof WorkingHours, index: number, patch: Partial<{ start: string; end: string }>) {
    const current = [...(hours[day].breaks ?? [])];
    current[index] = { ...current[index], ...patch };
    updateDay(day, { breaks: current });
  }

  function removeBreak(day: keyof WorkingHours, index: number) {
    const current = (hours[day].breaks ?? []).filter((_, i) => i !== index);
    updateDay(day, { breaks: current });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const result = await updateWorkingHoursAction(merchantId, hours as unknown as Json);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Program de lucru</h1>
        <Button size="sm" onClick={handleSave} isLoading={saving}>
          {saved ? "Salvat" : "Salvează"}
        </Button>
      </div>

      <Card>
        <CardContent className="divide-y divide-border/40 pt-6">
          {DAY_KEYS.map((day) => {
            const dayHours = hours[day];
            return (
              <div key={day} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex w-32 shrink-0 items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={dayHours.is_open}
                      onChange={(e) =>
                        updateDay(day, {
                          is_open: e.target.checked,
                          open: e.target.checked ? (dayHours.open ?? "09:00") : dayHours.open,
                          close: e.target.checked ? (dayHours.close ?? "18:00") : dayHours.close,
                        })
                      }
                      className="size-4 rounded border-input accent-accent"
                    />
                    {DAY_LABELS[day]}
                  </label>

                  {dayHours.is_open ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <input
                        type="time"
                        value={dayHours.open ?? "09:00"}
                        onChange={(e) => updateDay(day, { open: e.target.value })}
                        className="rounded-lg border border-input bg-card px-2.5 py-1.5 text-sm"
                      />
                      <span className="text-muted-foreground">–</span>
                      <input
                        type="time"
                        value={dayHours.close ?? "18:00"}
                        onChange={(e) => updateDay(day, { close: e.target.value })}
                        className="rounded-lg border border-input bg-card px-2.5 py-1.5 text-sm"
                      />
                      <Button variant="ghost" size="sm" onClick={() => addBreak(day)}>
                        <Plus className="size-3.5" />
                        Pauză
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Închis</span>
                  )}
                </div>

                {dayHours.is_open && (dayHours.breaks ?? []).length > 0 && (
                  <div className="flex flex-col gap-2 sm:ml-36">
                    {(dayHours.breaks ?? []).map((brk, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-xs">Pauză</span>
                        <input
                          type="time"
                          value={brk.start}
                          onChange={(e) => updateBreak(day, index, { start: e.target.value })}
                          className="rounded-lg border border-input bg-card px-2.5 py-1.5 text-sm text-foreground"
                        />
                        <span>–</span>
                        <input
                          type="time"
                          value={brk.end}
                          onChange={(e) => updateBreak(day, index, { end: e.target.value })}
                          className="rounded-lg border border-input bg-card px-2.5 py-1.5 text-sm text-foreground"
                        />
                        <Button variant="ghost" size="icon" aria-label="Șterge pauza" onClick={() => removeBreak(day, index)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
