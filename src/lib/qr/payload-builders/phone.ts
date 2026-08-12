import type { PhoneQrInput } from "@/lib/validation/qr";

export function buildPhonePayload(input: PhoneQrInput): string {
  return `tel:${input.phone.replace(/\s+/g, "")}`;
}
