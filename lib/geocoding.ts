export interface Coordinates {
  latitude: number;
  longitude: number;
}

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

/**
 * Best-effort address -> {latitude, longitude} via Nominatim (OpenStreetMap's
 * free geocoder -- no API key, and it pairs naturally with the Leaflet map
 * this feeds). Never throws: a merchant's profile save must succeed whether
 * or not geocoding does, so any failure (network, timeout, no match)
 * resolves to null and the caller just leaves latitude/longitude unset --
 * the map section hides itself rather than showing a wrong pin.
 */
export async function geocodeAddress(address: string | null | undefined, city: string): Promise<Coordinates | null> {
  const query = [address, city, "România"].filter(Boolean).join(", ").trim();
  if (!query) return null;

  try {
    const url = new URL(NOMINATIM_ENDPOINT);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "ro");
    url.searchParams.set("q", query);

    const response = await fetch(url, {
      // Nominatim's usage policy requires an identifying User-Agent
      // instead of a generic/absent one, or it may reject the request.
      headers: { "User-Agent": "Planno/1.0 (notificari@planno.ro)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;

    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    const first = results[0];
    if (!first) return null;

    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude };
  } catch (error) {
    console.error("[Geocodare] Failed to geocode address", { query, error });
    return null;
  }
}
