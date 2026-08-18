import type { VideoQrInput } from "@/lib/validation/qr";

/**
 * Unlike pdf/images/audio, this genuinely matters: a *static* video QR
 * encodes this URL directly (no landing page, no storage, no tracking —
 * `needsLandingPage` only changes what a *dynamic* video QR does). A
 * dynamic video QR's landing page reads the same URL back out of
 * `payload_data` to embed it.
 */
export function buildVideoPayload(input: VideoQrInput): string {
  return input.url;
}
