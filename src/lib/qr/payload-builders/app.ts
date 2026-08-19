import type { AppQrInput } from "@/lib/validation/qr";

/**
 * Never actually encoded into a QR image — `app` is `needsLandingPage:
 * true`, so `resolveEncodedPayload()` always encodes `/p/[slug]` for it
 * instead. This only exists so `buildQrPayload()` returns a non-empty
 * string once the content is valid, which is what `validateSaveInput()`
 * (`src/lib/qr/actions.ts`) actually checks for.
 */
export function buildAppPayload(input: AppQrInput): string {
  return input.title;
}
