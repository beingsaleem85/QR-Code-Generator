import type { PdfQrInput } from "@/lib/validation/qr";

/**
 * Never actually encoded into a QR image — `pdf` is `needsLandingPage:
 * true`, so `resolveEncodedPayload()` (`src/lib/qr/render.ts`) always
 * encodes `/p/[slug]` for it instead, the same way landing-page types
 * bypass this entirely. This only exists so `buildQrPayload()` returns a
 * non-empty string once a real upload has completed, which is what
 * `validateSaveInput()` (`src/lib/qr/actions.ts`) actually checks for.
 */
export function buildPdfPayload(input: PdfQrInput): string {
  return input.path;
}
