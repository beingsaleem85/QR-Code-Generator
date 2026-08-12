import type { EmailQrInput } from "@/lib/validation/qr";

export function buildEmailPayload(input: EmailQrInput): string {
  const params = new URLSearchParams();
  if (input.subject) params.set("subject", input.subject);
  if (input.body) params.set("body", input.body);
  const query = params.toString();
  return `mailto:${input.to}${query ? `?${query}` : ""}`;
}
