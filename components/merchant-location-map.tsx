"use client";

import { MapContainer, TileLayer, Marker, useMapEvent } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/button-variants";

/** Inline SVG instead of Leaflet's default marker images: those ship as
 *  separate PNG files whose default paths assume a classic script-tag
 *  setup and break under Next.js bundling unless manually rewired. A
 *  divIcon sidesteps that entirely. Same teal as the hero's "Experiențe
 *  & rezervări simple" badge (the one fixed brand hue in this app,
 *  deliberately not the theme-adaptive `accent` token -- OSM tiles are
 *  always light, so a pin that turned near-white in dark mode would
 *  vanish against them). */
const PIN_SVG = `<svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.716 23.284 0 15 0z" fill="#56a9a5"/>
  <circle cx="15" cy="15" r="5.5" fill="white"/>
</svg>`;

const pinIcon = L.divIcon({
  html: PIN_SVG,
  className: "",
  iconSize: [30, 38],
  // Anchored at the teardrop's point, not its center, so the pin's tip
  // (not its middle) marks the actual coordinate.
  iconAnchor: [15, 38],
});

/** Leaflet's own 'click' event, not a plain onClick on the wrapping div:
 *  Leaflet already suppresses it at the end of a pan-drag or a
 *  double-click-to-zoom, which a raw DOM click handler on the container
 *  wouldn't know to do (it would also fire after every drag-to-pan
 *  release). */
function ClickToNavigate({ url }: { url: string }) {
  useMapEvent("click", () => {
    window.open(url, "_blank", "noopener,noreferrer");
  });
  return null;
}

export interface MerchantLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string;
  businessName: string;
}

/**
 * A pin is only ever shown once the merchant's address has actually been
 * geocoded (see lib/geocoding.ts) -- latitude/longitude are null until
 * then, or if the lookup ever fails, and this renders just the
 * navigation button in that case (still useful: Google resolves the
 * plain address live, just without a preview pin here).
 */
export function MerchantLocationMap({ latitude, longitude, address, city, businessName }: MerchantLocationMapProps) {
  const hasCoordinates = latitude !== null && longitude !== null;
  const destination = hasCoordinates
    ? `${latitude},${longitude}`
    : [address, city, "România"].filter(Boolean).join(", ");
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;

  return (
    <div className="space-y-3">
      {hasCoordinates && (
        <div className="h-56 w-full overflow-hidden rounded-xl border border-border/40 sm:h-64">
          <MapContainer
            center={[latitude, longitude]}
            zoom={15}
            zoomControl={false}
            scrollWheelZoom={false}
            className="h-full w-full cursor-pointer"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker
              position={[latitude, longitude]}
              icon={pinIcon}
              alt={businessName}
              eventHandlers={{
                click: () => window.open(directionsUrl, "_blank", "noopener,noreferrer"),
              }}
            />
            <ClickToNavigate url={directionsUrl} />
          </MapContainer>
        </div>
      )}

      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
      >
        <Navigation className="size-3.5" aria-hidden="true" />
        Deschide Navigația
      </a>
    </div>
  );
}
