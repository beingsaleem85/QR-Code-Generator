import type { UrlQrInput } from "@/lib/validation/qr";

export function buildUrlPayload(input: UrlQrInput): string {
  return input.url;
}
