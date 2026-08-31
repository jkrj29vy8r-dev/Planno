"use client";

import * as React from "react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookingPanel } from "@/components/booking-panel";
import { ReviewSummary } from "@/components/review-summary";
import { ReviewCard } from "@/components/review-card";
import { Planni } from "@/components/planni";
import { formatPrice } from "@/lib/format";
import type { MerchantDetail } from "@/lib/data/merchants";
import type { ReviewSummary as ReviewSummaryData } from "@/lib/data/reviews";
import type { Tables } from "@/types/database.types";

type Service = Tables<"services">;
type TabId = "servicii" | "recenzii" | "despre";

interface MerchantProfileTabsProps {
  merchant: MerchantDetail;
  services: Service[];
  profile: Tables<"profiles"> | null;
  acceptsBookings: boolean;
  reviewSummary: ReviewSummaryData;
}

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<(typeof DAY_ORDER)[number], string> = {
  monday: "Luni",
  tuesday: "Marți",
  wednesday: "Miercuri",
  thursday: "Joi",
  friday: "Vineri",
  saturday: "Sâmbătă",
  sunday: "Duminică",
};

export function MerchantProfileTabs({
  merchant,
  services,
  profile,
  acceptsBookings,
  reviewSummary,
}: MerchantProfileTabsProps) {
  const [tab, setTab] = React.useState<TabId>("servicii");
  const canBook = acceptsBookings && services.length > 0;
  const fromPrice = services.length > 0 ? Math.min(...services.map((s) => s.price)) : null;
  const currency = services[0]?.currency ?? "RON";

  function goToServices() {
    setTab("servicii");
    document.getElementById("profil-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div id="profil-tabs" className="pb-4">
      <Tabs
        items={[
          { id: "servicii", label: "Servicii", count: services.length },
          { id: "recenzii", label: "Recenzii", count: reviewSummary.count },
          { id: "despre", label: "Despre" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
        className="mb-6"
      />

      {tab === "servicii" &&
        (canBook ? (
          <BookingPanel merchant={merchant} services={services} profile={profile} />
        ) : (
          <EmptyServicesState acceptsBookings={acceptsBookings} businessName={merchant.business_name} />
        ))}

      {tab === "recenzii" && (
        <div className="space-y-6">
          <ReviewSummary
            average={reviewSummary.average}
            count={reviewSummary.count}
            distribution={reviewSummary.distribution}
          />
          {reviewSummary.reviews.length > 0 && (
            <div>
              {reviewSummary.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "despre" && <AboutTab merchant={merchant} />}

      {/* Mobile-only sticky conversion bar -- BookingPanel's own confirm
          button only appears once a slot is picked, this stays visible
          from the moment the page loads regardless of tab or scroll
          position, sitting just above BottomNav. */}
      {canBook && (
        <div className="fixed inset-x-0 bottom-[calc(4.9375rem+env(safe-area-inset-bottom))] z-30 border-t border-border/40 bg-background/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-lg md:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-4">
            <div className="min-w-0">
              {fromPrice !== null && (
                <p className="truncate text-sm font-semibold">de la {formatPrice(fromPrice, currency)}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {services.length} {services.length === 1 ? "serviciu" : "servicii"}
              </p>
            </div>
            <Button size="md" className="shrink-0" onClick={goToServices}>
              Rezervă
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyServicesState({
  acceptsBookings,
  businessName,
}: {
  acceptsBookings: boolean;
  businessName: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border/40 bg-card py-16 text-center">
      <Planni state="empty-state" size={128} message="" />
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {acceptsBookings ? "Niciun serviciu disponibil momentan" : "Rezervările sunt momentan indisponibile"}
        </p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {acceptsBookings
            ? "Acest comerciant nu are servicii active de rezervat."
            : `${businessName} nu preia rezervări online în această perioadă. Încearcă din nou mai târziu sau contactează direct comerciantul.`}
        </p>
      </div>
    </div>
  );
}

function AboutTab({ merchant }: { merchant: MerchantDetail }) {
  const hours = merchant.working_hours as Record<
    string,
    { is_open: boolean; open: string | null; close: string | null }
  >;

  return (
    <div className="max-w-xl space-y-6">
      {merchant.description && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Despre</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{merchant.description}</p>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold">Program</h3>
        <div className="divide-y divide-border/40 rounded-xl border border-border/40">
          {DAY_ORDER.map((day) => {
            const d = hours?.[day];
            return (
              <div key={day} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{DAY_LABELS[day]}</span>
                <span className="font-medium">{d?.is_open ? `${d.open} - ${d.close}` : "Închis"}</span>
              </div>
            );
          })}
        </div>
      </div>

      {(merchant.phone || merchant.email) && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Contact</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            {merchant.phone && <p>{merchant.phone}</p>}
            {merchant.email && <p>{merchant.email}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
