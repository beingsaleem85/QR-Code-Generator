import { describe, expect, it } from "vitest";
import { emailQrSchema } from "@/lib/validation/qr";
import { buildEmailPayload } from "@/lib/qr/payload-builders";

describe("email QR", () => {
  it("builds a bare mailto payload", () => {
    const parsed = emailQrSchema.parse({ to: "person@example.com" });
    expect(buildEmailPayload(parsed)).toBe("mailto:person@example.com");
  });

  it("builds a mailto payload with subject and body", () => {
    const parsed = emailQrSchema.parse({
      to: "person@example.com",
      subject: "Hi there",
      body: "Let's meet up",
    });
    expect(buildEmailPayload(parsed)).toBe(
      "mailto:person@example.com?subject=Hi+there&body=Let%27s+meet+up",
    );
  });

  it("rejects an invalid email address", () => {
    expect(() => emailQrSchema.parse({ to: "not-an-email" })).toThrow();
  });

  it("preserves unicode in the subject", () => {
    const parsed = emailQrSchema.parse({ to: "person@example.com", subject: "café ☕" });
    expect(buildEmailPayload(parsed)).toContain(encodeURIComponent("café ☕").replace(/%20/g, "+"));
  });
});
