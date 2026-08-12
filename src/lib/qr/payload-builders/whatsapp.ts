import type { WhatsAppQrInput } from "@/lib/validation/qr";

export function buildWhatsAppPayload(input: WhatsAppQrInput): string {
  const digits = input.phone.replace(/\D/g, "");
  const query = input.message ? `?text=${encodeURIComponent(input.message)}` : "";
  return `https://wa.me/${digits}${query}`;
}
