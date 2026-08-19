import { describe, expect, it } from "vitest";
import { eventQrSchema } from "@/lib/validation/qr";
import { buildEventPayload } from "@/lib/qr/payload-builders";

describe("event QR", () => {
  it("builds a minimal VEVENT payload", () => {
    const parsed = eventQrSchema.parse({
      title: "Team Sync",
      start: "2026-09-01T10:00:00.000Z",
    });
    const payload = buildEventPayload(parsed);
    expect(payload).toContain("BEGIN:VCALENDAR");
    expect(payload).toContain("BEGIN:VEVENT");
    expect(payload).toContain("SUMMARY:Team Sync");
    expect(payload).toContain("DTSTART:20260901T100000Z");
    expect(payload).toContain("END:VEVENT");
    expect(payload).toContain("END:VCALENDAR");
  });

  it("includes optional fields when provided", () => {
    const parsed = eventQrSchema.parse({
      title: "Launch Party",
      start: "2026-09-01T18:00:00.000Z",
      end: "2026-09-01T21:00:00.000Z",
      location: "Rooftop, 5th Ave",
      description: "Bring snacks, drinks; and good vibes",
    });
    const payload = buildEventPayload(parsed);
    expect(payload).toContain("DTEND:20260901T210000Z");
    expect(payload).toContain("LOCATION:Rooftop\\, 5th Ave");
    expect(payload).toContain("DESCRIPTION:Bring snacks\\, drinks\\; and good vibes");
  });

  it("rejects an end before the start", () => {
    expect(() =>
      eventQrSchema.parse({
        title: "Broken Event",
        start: "2026-09-01T18:00:00.000Z",
        end: "2026-09-01T10:00:00.000Z",
      }),
    ).toThrow();
  });

  it("rejects an invalid start date", () => {
    expect(() => eventQrSchema.parse({ title: "Bad Date", start: "not-a-date" })).toThrow();
  });

  it("still rejects a genuinely invalid (non-blank) end date", () => {
    expect(() =>
      eventQrSchema.parse({
        title: "Bad End",
        start: "2026-09-01T10:00:00.000Z",
        end: "not-a-date",
      }),
    ).toThrow();
  });

  it('accepts a blank end date the way the form actually submits it — as "", not undefined', () => {
    // EventForm's defaultValues always send a string for `end` (asString()
    // defaults to ""), never an omitted/undefined key — this is the exact
    // shape a real Save click produces when the (labeled optional) Ends
    // field is left blank.
    const parsed = eventQrSchema.parse({
      title: "No End Time",
      start: "2026-09-01T10:00:00.000Z",
      end: "",
    });
    const payload = buildEventPayload(parsed);
    expect(payload).not.toContain("DTEND:");
  });

  it("also accepts a whitespace-only end date the same way", () => {
    expect(() =>
      eventQrSchema.parse({
        title: "No End Time",
        start: "2026-09-01T10:00:00.000Z",
        end: "   ",
      }),
    ).not.toThrow();
  });
});
