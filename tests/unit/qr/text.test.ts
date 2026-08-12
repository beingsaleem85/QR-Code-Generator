import { describe, expect, it } from "vitest";
import { textQrSchema } from "@/lib/validation/qr";
import { buildTextPayload } from "@/lib/qr/payload-builders";

describe("text QR", () => {
  it("builds a payload for valid text", () => {
    const parsed = textQrSchema.parse({ text: "Hello, world!" });
    expect(buildTextPayload(parsed)).toBe("Hello, world!");
  });

  it("preserves unicode", () => {
    const parsed = textQrSchema.parse({ text: "こんにちは 👋" });
    expect(buildTextPayload(parsed)).toBe("こんにちは 👋");
  });

  it("rejects empty text", () => {
    expect(() => textQrSchema.parse({ text: "" })).toThrow();
  });

  it("rejects text over the length limit", () => {
    expect(() => textQrSchema.parse({ text: "a".repeat(2001) })).toThrow();
  });
});
