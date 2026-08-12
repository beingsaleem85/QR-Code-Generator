import type { VCardQrInput } from "@/lib/validation/qr";
import { escapeStructuredTextValue } from "./shared/escaping";

export function buildVCardPayload(input: VCardQrInput): string {
  const firstName = input.firstName ? escapeStructuredTextValue(input.firstName) : "";
  const lastName = input.lastName ? escapeStructuredTextValue(input.lastName) : "";
  const fullName = [input.firstName, input.lastName].filter(Boolean).join(" ").trim();

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${lastName};${firstName};;;`,
    `FN:${escapeStructuredTextValue(fullName || firstName || lastName)}`,
  ];

  if (input.company) lines.push(`ORG:${escapeStructuredTextValue(input.company)}`);
  if (input.title) lines.push(`TITLE:${escapeStructuredTextValue(input.title)}`);
  if (input.phone) lines.push(`TEL;TYPE=WORK,VOICE:${escapeStructuredTextValue(input.phone)}`);
  if (input.mobile) lines.push(`TEL;TYPE=CELL:${escapeStructuredTextValue(input.mobile)}`);
  if (input.email) lines.push(`EMAIL:${escapeStructuredTextValue(input.email)}`);
  if (input.website) lines.push(`URL:${escapeStructuredTextValue(input.website)}`);

  lines.push("END:VCARD");
  return lines.join("\n");
}
