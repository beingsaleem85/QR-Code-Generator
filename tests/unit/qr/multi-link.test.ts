import { describe, expect, it } from "vitest";
import { multiLinkQrSchema } from "@/lib/validation/qr";
import { buildMultiLinkPayload } from "@/lib/qr/payload-builders";

describe("multiLinkQrSchema", () => {
  it("accepts a title with at least one link", () => {
    const result = multiLinkQrSchema.safeParse({
      title: "My Links",
      links: [{ label: "Website", url: "example.com" }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.links[0].url).toBe("https://example.com");
  });

  it("rejects a title with no links", () => {
    expect(multiLinkQrSchema.safeParse({ title: "My Links", links: [] }).success).toBe(false);
  });

  it("rejects a link with an empty label", () => {
    const result = multiLinkQrSchema.safeParse({
      title: "My Links",
      links: [{ label: "", url: "https://example.com" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty title", () => {
    const result = multiLinkQrSchema.safeParse({
      title: "",
      links: [{ label: "Website", url: "https://example.com" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("buildMultiLinkPayload", () => {
  it("returns the title — never actually encoded into a QR image", () => {
    expect(buildMultiLinkPayload({ title: "My Links", links: [] })).toBe("My Links");
  });
});
