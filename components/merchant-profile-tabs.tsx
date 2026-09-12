"use client";

import * as React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookingPanel } from "@/components/booking-panel";
import { ReviewSummary } from "@/components/review-summary";
import { ReviewCard } from "@/components/review-card";
import { Lightbox } from "@/components/lightbox";
import { Planni } from "@/components/planni";
import { formatPrice } from "@/lib/format";
import type { MerchantDetail } from "@/lib/data/merchants";
import type { ReviewSummary as ReviewSummaryData } from "@/lib/data/reviews";
import type { Tables } from "@/types/database.types";

// Leaflet touches `window` at module scope, so it can never run during
// the server render Next.js does for this "use client" tree's first
// paint -- ssr: false skips that render instead of throwing.
const MerchantLocationMap = dynamic(
  () => import("@/components/merchant-location-map").then((m) => m.MerchantLocationMap),
  { ssr: false, loading: () => <div className="h-56 w-full animate-pulse rounded-xl bg-muted sm:h-64" /> },
);

type Service = Tables<"services">;
type StaffMember = Tables<"staff_members">;
type TabId = "servicii" | "recenzii" | "despre" | "echipa" | "galerie";

interface MerchantProfileTabsProps {
  merchant: MerchantDetail;
  services: Service[];
  profile: Tables<"profiles"> | null;
  acceptsBookings: boolean;
  reviewSummary: ReviewSummaryData;
  staff: StaffMember[];
}

/** Shared by the merchant's own "Galerie" tab and every staff member's
 *  portfolio in "Echipă" -- one lightbox instance for the whole page,
 *  which set of images it's showing swapped per click rather than each
 *  gallery owning (and rendering) its own dialog. */
interface LightboxState {
  images: string[];
  index: number;
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
  staff,
}: MerchantProfileTabsProps) {
  const [tab, setTab] = React.useState<TabId>("servicii");
  const [lightbox, setLightbox] = React.useState<LightboxState | null>(null);
  const canBook = acceptsBookings && services.length > 0;
  const fromPrice = services.length > 0 ? Math.min(...services.map((s) => s.price)) : null;
  const currency = services[0]?.currency ?? "RON";
  const galleryImages = merchant.gallery_urls;

  function goToServices() {
    setTab("servicii");
    document.getElementById("profil-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Only shown once a merchant has actually uploaded photos, or has at
  // least one staff member -- an empty tab would just be a dead end.
  const tabItems: TabItem[] = [
    { id: "servicii", label: "Servicii", count: services.length },
    { id: "recenzii", label: "Recenzii", count: reviewSummary.count },
    { id: "despre", label: "Despre" },
  ];
  if (staff.length > 0) {
    tabItems.push({ id: "echipa", label: "Echipă", count: staff.length });
  }
  if (galleryImages.length > 0) {
    tabItems.push({ id: "galerie", label: "Galerie", count: galleryImages.length });
  }

  return (
    <div id="profil-tabs" className="pb-4">
      <Tabs items={tabItems} active={tab} onChange={(id) => setTab(id as TabId)} className="mb-6" />

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

      {tab === "echipa" && (
        <TeamTab staff={staff} onOpenImage={(images, index) => setLightbox({ images, index })} />
      )}

      {tab === "galerie" && (
        <GalleryGrid
          images={galleryImages}
          businessName={merchant.business_name}
          onOpenImage={(index) => setLightbox({ images: galleryImages, index })}
        />
      )}

      <Lightbox
        images={lightbox?.images ?? []}
        index={lightbox?.index ?? 0}
        onIndexChange={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
        open={lightbox !== null}
        onOpenChange={(open) => !open && setLightbox(null)}
      />

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

      {merchant.city && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Locație</h3>
          <MerchantLocationMap
            latitude={merchant.latitude}
            longitude={merchant.longitude}
            address={merchant.address}
            city={merchant.city}
            businessName={merchant.business_name}
          />
        </div>
      )}
    </div>
  );
}

function GalleryGrid({
  images,
  businessName,
  onOpenImage,
}: {
  images: string[];
  businessName: string;
  onOpenImage: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((url, index) => (
        <button
          key={url}
          type="button"
          onClick={() => onOpenImage(index)}
          aria-label={`Vezi fotografia ${index + 1} mărită`}
          className="relative aspect-square overflow-hidden rounded-xl border border-border/40 bg-muted transition-opacity hover:opacity-90"
        >
          <Image
            src={url}
            alt={businessName}
            fill
            sizes="(min-width: 640px) 33vw, 50vw"
            className="object-cover object-center"
          />
        </button>
      ))}
    </div>
  );
}

function TeamTab({
  staff,
  onOpenImage,
}: {
  staff: StaffMember[];
  onOpenImage: (images: string[], index: number) => void;
}) {
  return (
    <div className="space-y-6">
      {staff.map((member) => (
        <div key={member.id} className="flex flex-col gap-4 rounded-xl border border-border/40 bg-card p-5 sm:flex-row">
          <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:text-left">
            {member.avatar_url ? (
              <Image
                src={member.avatar_url}
                alt=""
                width={64}
                height={64}
                className="size-16 shrink-0 rounded-full object-cover object-center"
              />
            ) : (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
                {member.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="sm:mt-1">
              <p className="font-medium">{member.name}</p>
              {member.title && <p className="text-xs text-muted-foreground">{member.title}</p>}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            {member.bio && <p className="text-sm leading-relaxed text-muted-foreground">{member.bio}</p>}
            {member.gallery_urls.length > 0 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {member.gallery_urls.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => onOpenImage(member.gallery_urls, index)}
                    aria-label={`Vezi fotografia ${index + 1} din portofoliul lui ${member.name}`}
                    className="relative aspect-square overflow-hidden rounded-lg border border-border/40 bg-muted transition-opacity hover:opacity-90"
                  >
                    <Image src={url} alt="" fill sizes="120px" className="object-cover object-center" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
