import type { AudioQrInput } from "@/lib/validation/qr";

/** Never encoded into a QR image — see `buildPdfPayload`'s doc comment. */
export function buildAudioPayload(input: AudioQrInput): string {
  return input.path;
}
