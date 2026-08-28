"use client";

import * as React from "react";
import { Planni, type PlanniState } from "@/components/planni";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATES: PlanniState[] = ["welcome", "empty-state", "success", "error", "loading"];

const LABELS: Record<PlanniState, string> = {
  welcome: "Welcome",
  "empty-state": "Empty state",
  success: "Success",
  error: "Error",
  loading: "Loading",
};

export default function MascotPreview() {
  const [state, setState] = React.useState<PlanniState>("welcome");

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center gap-10 px-6 py-16">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {STATES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={s === state ? "primary" : "outline"}
            magnetic={false}
            onClick={() => setState(s)}
          >
            {LABELS[s]}
          </Button>
        ))}
      </div>

      <Card className="flex w-full items-center justify-center py-16">
        <CardContent>
          <Planni state={state} size={200} />
        </CardContent>
      </Card>

      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-5">
        {STATES.map((s) => (
          <div
            key={s}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-card p-4",
              s === state && "border-accent/50",
            )}
          >
            <Planni state={s} size={88} message="" />
            <span className="text-xs text-muted-foreground">{LABELS[s]}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
