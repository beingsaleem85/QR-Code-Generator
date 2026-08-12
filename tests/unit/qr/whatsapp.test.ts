import { describe, expect, it } from "vitest";
import { whatsappQrSchema } from "@/lib/validation/qr";
import { buildWhatsAppPayload } from "@/lib/qr/payload-builders";

describe("whatsapp QR", () => {
  it("builds a wa.me link with digits only", () => {
    const parsed = whatsappQrSchema.parse({ phone: "+1 (555) 123-4567" });
    expect(buildWhatsAppPayload(parsed)).toBe("https://wa.me/15551234567");
  });

  it("includes an encoded message", () => {
    const parsed = whatsappQrSchema.parse({ phone: "+15551234567", message: "Hi there!" });
    expect(buildWhatsAppPayload(parsed)).toBe("https://wa.me/15551234567?text=Hi%20there!");
  });

  it("preserves unicode in the message", () => {
    const parsed = whatsappQrSchema.parse({ phone: "+15551234567", message: "こんにちは" });
    expect(buildWhatsAppPayload(parsed)).toBe(
      `https://wa.me/15551234567?text=${encodeURIComponent("こんにちは")}`,
    );
  });
});
