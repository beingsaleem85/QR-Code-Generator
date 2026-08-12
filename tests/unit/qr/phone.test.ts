import { describe, expect, it } from "vitest";
import { phoneQrSchema } from "@/lib/validation/qr";
import { buildPhonePayload } from "@/lib/qr/payload-builders";

describe("phone QR", () => {
  it("builds a tel payload", () => {
    const parsed = phoneQrSchema.parse({ phone: "+1 555 123 4567" });
    expect(buildPhonePayload(parsed)).toBe("tel:+15551234567");
  });

  it("rejects an empty phone number", () => {
    expect(() => phoneQrSchema.parse({ phone: "" })).toThrow();
  });

  it("rejects a non-phone string", () => {
    expect(() => phoneQrSchema.parse({ phone: "call me maybe" })).toThrow();
  });
});
