import type { Barcode2dQrInput } from "@/lib/validation/qr/barcode-2d";

/**
 * Builds data payload for Data Matrix ECC 200 2D barcode.
 */
export function buildBarcode2dPayload(input: Barcode2dQrInput): string {
  return input.data;
}
