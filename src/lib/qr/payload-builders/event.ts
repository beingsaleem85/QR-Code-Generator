import type { EventQrInput } from "@/lib/validation/qr";
import { escapeStructuredTextValue } from "./shared/escaping";

function toICalDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildEventPayload(input: EventQrInput): string {
  const lines = [
    "BEGIN:VEVENT",
    `SUMMARY:${escapeStructuredTextValue(input.title)}`,
    `DTSTART:${toICalDate(input.start)}`,
  ];

  if (input.end) lines.push(`DTEND:${toICalDate(input.end)}`);
  if (input.location) lines.push(`LOCATION:${escapeStructuredTextValue(input.location)}`);
  if (input.description) lines.push(`DESCRIPTION:${escapeStructuredTextValue(input.description)}`);

  lines.push("END:VEVENT");

  return ["BEGIN:VCALENDAR", "VERSION:2.0", ...lines, "END:VCALENDAR"].join("\n");
}
