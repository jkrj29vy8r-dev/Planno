export interface Coordinates {
  latitude: number;
  longitude: number;
}

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

async function queryNominatim(query: string): Promise<Coordinates | null> {
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
  if (!response.ok) {
    // Logged distinctly from "no match" below -- a 403/429 here means
    // Nominatim itself rejected/throttled the request, which needs a
    // different fix (backoff, a different provider) than a query that
    // genuinely has no result.
    console.error("[Geocodare] Nominatim returned non-OK status", { query, status: response.status });
    return null;
  }

  const results = (await response.json()) as Array<{ lat: string; lon: string }>;
  const first = results[0];
  if (!first) return null;

  const latitude = Number(first.lat);
  const longitude = Number(first.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
}

/**
 * Best-effort address -> {latitude, longitude} via Nominatim (OpenStreetMap's
 * free geocoder -- no API key, and it pairs naturally with the Leaflet map
 * this feeds). Never throws: a merchant's profile save must succeed whether
 * or not geocoding does, so any failure (network, timeout, no match)
 * resolves to null and the caller just leaves latitude/longitude unset --
 * the map section hides itself rather than showing a wrong pin.
 *
 * Tries the full street address first, then falls back to just the city:
 * OSM's address-point coverage is patchy for exact house numbers on minor
 * streets in smaller Romanian towns, so a query that includes one can come
 * back with nothing even though the city itself resolves fine -- city-level
 * coordinates are still far more useful on the map than no pin at all.
 */
export async function geocodeAddress(address: string | null | undefined, city: string): Promise<Coordinates | null> {
  const fullQuery = [address, city, "România"].filter(Boolean).join(", ").trim();
  if (!fullQuery) return null;

  try {
    const precise = await queryNominatim(fullQuery);
    if (precise) return precise;

    if (!address) return null;
    return await queryNominatim(`${city}, România`);
  } catch (error) {
    console.error("[Geocodare] Failed to geocode address", { fullQuery, error });
    return null;
  }
}
