"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Planni } from "@/components/planni";
import { cn } from "@/lib/utils";
import { formatDateChip, formatDuration, formatPrice } from "@/lib/format";
import { formatTimeInZone, todayInZone } from "@/lib/timezone";
import { fetchAvailableSlotsAction } from "@/lib/actions/availability";
import { createBookingAction } from "@/lib/actions/bookings";
import type { MerchantDetail } from "@/lib/data/merchants";
import type { Tables } from "@/types/database.types";

type Service = Tables<"services">;

interface BookingPanelProps {
  merchant: MerchantDetail;
  services: Service[];
  isAuthenticated: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;

function nextDays(count: number, timezone: string): string[] {
  const today = todayInZone(timezone);
  const [y, m, d] = today.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(base);
    day.setUTCDate(base.getUTCDate() + i);
    return day.toISOString().slice(0, 10);
  });
}

export function BookingPanel({ merchant, services, isAuthenticated }: BookingPanelProps) {
  const dateOptions = React.useMemo(() => nextDays(7, merchant.timezone), [merchant.timezone]);

  const [selectedService, setSelectedService] = React.useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = React.useState(dateOptions[0]);
  const [slots, setSlots] = React.useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState("");
  const [step, setStep] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  const loadSlots = React.useCallback(
    async (service: Service, date: string) => {
      setSlotsLoading(true);
      setSelectedSlot(null);
      try {
        const result = await fetchAvailableSlotsAction({
          merchantId: merchant.id,
          date,
          timezone: merchant.timezone,
          durationMinutes: service.duration_minutes,
          workingHours: merchant.working_hours,
        });
        setSlots(result);
      } finally {
        setSlotsLoading(false);
      }
    },
    [merchant.id, merchant.timezone, merchant.working_hours],
  );

  function handleSelectService(service: Service) {
    setSelectedService(service);
    setStep("idle");
    void loadSlots(service, selectedDate);
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    if (selectedService) void loadSlots(selectedService, date);
  }

  async function handleConfirm() {
    if (!selectedService || !selectedSlot) return;
    setStep("loading");
    const result = await createBookingAction({
      merchantId: merchant.id,
      serviceId: selectedService.id,
      startTime: selectedSlot,
      clientNotes: notes || undefined,
    });

    if (result.error) {
      setErrorMessage(result.error);
      setStep("error");
      return;
    }
    setStep("success");
  }

  function resetFlow() {
    setSelectedService(null);
    setSelectedSlot(null);
    setNotes("");
    setStep("idle");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Click 1: pick a service */}
      <div className="space-y-3">
        {services.map((service) => {
          const isSelected = selectedService?.id === service.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => handleSelectService(service)}
              className={cn(
                "flex w-full items-center justify-between gap-4 rounded-xl border bg-card px-5 py-4 text-left transition-colors",
                isSelected ? "border-accent ring-2 ring-ring" : "border-border/40 hover:border-border",
              )}
            >
              <div>
                <p className="font-medium">{service.name}</p>
                {service.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{service.description}</p>
                )}
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {formatDuration(service.duration_minutes)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-sm font-medium">
                  {formatPrice(service.price, service.currency)}
                </span>
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border",
                    isSelected ? "border-accent bg-accent text-accent-foreground" : "border-border",
                  )}
                >
                  {isSelected && <Check className="size-3" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardContent className="space-y-5 pt-6">
            <AnimatePresence mode="wait">
              {step === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-1 py-4 text-center"
                >
                  <Planni state="success" size={120} message="Rezervare confirmată! O găsești în contul tău." />
                  <Button variant="outline" size="sm" className="mt-4" onClick={resetFlow}>
                    Fă o altă rezervare
                  </Button>
                </motion.div>
              ) : step === "error" ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-1 py-4 text-center"
                >
                  <Planni state="error" size={110} message={errorMessage} />
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setStep("idle")}>
                    Încearcă din nou
                  </Button>
                </motion.div>
              ) : step === "loading" ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-6"
                >
                  <Planni state="loading" size={110} />
                </motion.div>
              ) : !selectedService ? (
                <motion.p
                  key="prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  Alege un serviciu pentru a vedea intervalele disponibile.
                </motion.p>
              ) : (
                <motion.div
                  key="picker"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="space-y-5"
                >
                  <div>
                    <p className="mb-2 text-sm font-medium">Alege o zi</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {dateOptions.map((date) => {
                        const chip = formatDateChip(new Date(`${date}T12:00:00Z`), merchant.timezone);
                        const isSelected = selectedDate === date;
                        return (
                          <button
                            key={date}
                            type="button"
                            onClick={() => handleSelectDate(date)}
                            className={cn(
                              "flex shrink-0 flex-col items-center gap-0.5 rounded-lg border px-3 py-2 text-xs transition-colors",
                              isSelected
                                ? "border-accent bg-accent text-accent-foreground"
                                : "border-border/50 text-muted-foreground hover:bg-muted/60",
                            )}
                          >
                            <span>{chip.weekday}</span>
                            <span className="font-medium">{chip.day}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Click 2: pick a time slot */}
                  <div>
                    <p className="mb-2 text-sm font-medium">Alege o oră</p>
                    {slotsLoading ? (
                      <div className="flex justify-center py-4">
                        <Planni state="loading" size={72} message="" />
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border py-4 text-center text-sm text-muted-foreground">
                        Nicio oră liberă în această zi.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={cn(
                              "rounded-lg border px-2 py-2 font-mono text-sm transition-colors",
                              selectedSlot === slot
                                ? "border-accent bg-accent text-accent-foreground"
                                : "border-border/50 hover:bg-muted/60",
                            )}
                          >
                            {formatTimeInZone(new Date(slot), merchant.timezone)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedSlot && (
                    <>
                      <Input
                        label="Observații (opțional)"
                        placeholder="Ex: prima vizită, alergii, preferințe..."
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                      />

                      {/* Click 3: confirm */}
                      {isAuthenticated ? (
                        <Button className="w-full" onClick={handleConfirm}>
                          Confirmă rezervarea
                        </Button>
                      ) : (
                        <div className="space-y-2 text-center">
                          <p className="text-sm text-muted-foreground">
                            Conectează-te pentru a finaliza rezervarea.
                          </p>
                          <Link
                            href={`/login?redirect=/merchants/${merchant.slug}`}
                            className={cn(buttonVariants({ size: "md" }), "w-full")}
                          >
                            Conectare
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
