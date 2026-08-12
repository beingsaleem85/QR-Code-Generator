import { describe, expect, it } from "vitest";
import { urlQrSchema } from "@/lib/validation/qr";
import { buildUrlPayload } from "@/lib/qr/payload-builders";

describe("url QR", () => {
  it("builds a payload for a valid https URL", () => {
    const parsed = urlQrSchema.parse({ url: "https://example.com/path?x=1" });
    expect(buildUrlPayload(parsed)).toBe("https://example.com/path?x=1");
  });

  it("normalizes a scheme-less URL to https", () => {
    const parsed = urlQrSchema.parse({ url: "example.com" });
    expect(buildUrlPayload(parsed)).toBe("https://example.com");
  });

  it("rejects a dangerous scheme", () => {
    expect(() => urlQrSchema.parse({ url: "javascript:alert(1)" })).toThrow();
  });

  it("rejects an empty URL", () => {
    expect(() => urlQrSchema.parse({ url: "" })).toThrow();
  });

  it("preserves unicode in the path", () => {
    const parsed = urlQrSchema.parse({ url: "https://example.com/café" });
    expect(buildUrlPayload(parsed)).toBe("https://example.com/café");
  });
});
