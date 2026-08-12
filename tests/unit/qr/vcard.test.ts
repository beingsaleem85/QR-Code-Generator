import { describe, expect, it } from "vitest";
import { vcardQrSchema } from "@/lib/validation/qr";
import { buildVCardPayload } from "@/lib/qr/payload-builders";

describe("vcard QR", () => {
  it("builds a minimal vCard from a first name only", () => {
    const parsed = vcardQrSchema.parse({ firstName: "Ada" });
    const payload = buildVCardPayload(parsed);
    expect(payload).toContain("BEGIN:VCARD");
    expect(payload).toContain("VERSION:3.0");
    expect(payload).toContain("N:;Ada;;;");
    expect(payload).toContain("FN:Ada");
    expect(payload).toContain("END:VCARD");
  });

  it("builds a full vCard with all fields", () => {
    const parsed = vcardQrSchema.parse({
      firstName: "Ada",
      lastName: "Lovelace",
      phone: "+15551230000",
      mobile: "+15559990000",
      email: "ada@example.com",
      website: "https://example.com",
      company: "Analytical Engines Inc",
      title: "Mathematician",
    });
    const payload = buildVCardPayload(parsed);
    expect(payload).toContain("N:Lovelace;Ada;;;");
    expect(payload).toContain("FN:Ada Lovelace");
    expect(payload).toContain("ORG:Analytical Engines Inc");
    expect(payload).toContain("TITLE:Mathematician");
    expect(payload).toContain("TEL;TYPE=WORK,VOICE:+15551230000");
    expect(payload).toContain("TEL;TYPE=CELL:+15559990000");
    expect(payload).toContain("EMAIL:ada@example.com");
    expect(payload).toContain("URL:https://example.com");
  });

  it("escapes commas and semicolons in text fields", () => {
    const parsed = vcardQrSchema.parse({ firstName: "Ada, Jr.;II" });
    expect(buildVCardPayload(parsed)).toContain("N:;Ada\\, Jr.\\;II;;;");
  });

  it("rejects a vcard with no name", () => {
    expect(() => vcardQrSchema.parse({ company: "Acme" })).toThrow();
  });

  it("preserves unicode names", () => {
    const parsed = vcardQrSchema.parse({ firstName: "山田", lastName: "太郎" });
    expect(buildVCardPayload(parsed)).toContain("FN:山田 太郎");
  });
});
