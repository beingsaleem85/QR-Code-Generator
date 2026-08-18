import type { ImagesQrInput } from "@/lib/validation/qr";

/**
 * Never actually encoded into a QR image — see `buildPdfPayload`'s doc
 * comment for why (same reasoning, `images` is also `needsLandingPage:
 * true`). Just needs to be non-empty once at least one image has uploaded.
 */
export function buildImagesPayload(input: ImagesQrInput): string {
  return input.images.map((image) => image.path).join(",");
}
