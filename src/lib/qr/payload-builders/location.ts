import type { LocationQrInput } from "@/lib/validation/qr/location";

/**
 * Builds scannable payload for Location QR codes.
 * If format is 'geo', generates standard RFC 5870 `geo:lat,lng` URI.
 * If format is 'maps' (default), generates HTTPS Google Maps search URL.
 */
export function buildLocationPayload(input: LocationQrInput): string {
  const lat = input.latitude;
  const lng = input.longitude;
  const query = input.query ? input.query.trim() : "";

  if (input.format === "geo") {
    if (query) {
      return `geo:${lat},${lng}?q=${encodeURIComponent(query)}`;
    }
    return `geo:${lat},${lng}`;
  }

  // Default: Google Maps HTTPS URL for broad mobile camera compatibility
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng} (${query})`)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
