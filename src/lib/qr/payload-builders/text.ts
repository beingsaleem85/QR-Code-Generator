import type { TextQrInput } from "@/lib/validation/qr";

export function buildTextPayload(input: TextQrInput): string {
  return input.text;
}
