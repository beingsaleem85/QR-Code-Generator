import type { SmsQrInput } from "@/lib/validation/qr";

export function buildSmsPayload(input: SmsQrInput): string {
  const number = input.phone.replace(/\s+/g, "");
  return `sms:${number}${input.message ? `?body=${encodeURIComponent(input.message)}` : ""}`;
}
