import { describe, expect, it } from "vitest";
import { smsQrSchema } from "@/lib/validation/qr";
import { buildSmsPayload } from "@/lib/qr/payload-builders";

describe("sms QR", () => {
  it("builds a bare sms payload", () => {
    const parsed = smsQrSchema.parse({ phone: "+15551234567" });
    expect(buildSmsPayload(parsed)).toBe("sms:+15551234567");
  });

  it("builds an sms payload with a message body", () => {
    const parsed = smsQrSchema.parse({ phone: "+15551234567", message: "On my way!" });
    expect(buildSmsPayload(parsed)).toBe("sms:+15551234567?body=On%20my%20way!");
  });

  it("rejects an invalid phone number", () => {
    expect(() => smsQrSchema.parse({ phone: "" })).toThrow();
  });
});
