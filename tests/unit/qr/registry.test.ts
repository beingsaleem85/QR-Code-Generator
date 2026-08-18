import { describe, expect, it } from "vitest";
import { qrTypeRegistry, getQrTypeDefinition, listQrTypeDefinitions } from "@/lib/qr/registry";

const IMPLEMENTED_TYPES = [
  "url",
  "text",
  "email",
  "phone",
  "sms",
  "vcard",
  "whatsapp",
  "wifi",
  "event",
  "pdf",
  "images",
  "audio",
  "video",
] as const;

describe("QR type registry", () => {
  it("has exactly 20 entries, one per QRType", () => {
    expect(listQrTypeDefinitions()).toHaveLength(20);
  });

  it("keys every entry's `key` field to match its registry key", () => {
    for (const [key, definition] of Object.entries(qrTypeRegistry)) {
      expect(definition.key).toBe(key);
    }
  });

  it("gives every entry a non-empty label and icon", () => {
    for (const definition of listQrTypeDefinitions()) {
      expect(definition.label.length).toBeGreaterThan(0);
      expect(definition.icon.length).toBeGreaterThan(0);
    }
  });

  it("defines a payloadBuilder only for types with a real content form", () => {
    for (const definition of listQrTypeDefinitions()) {
      const hasBuilder = typeof definition.payloadBuilder === "function";
      expect(hasBuilder).toBe(
        IMPLEMENTED_TYPES.includes(definition.key as (typeof IMPLEMENTED_TYPES)[number]),
      );
    }
  });

  it("resolves a definition by type via getQrTypeDefinition", () => {
    expect(getQrTypeDefinition("url").key).toBe("url");
  });
});
