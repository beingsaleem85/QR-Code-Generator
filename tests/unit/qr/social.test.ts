import { describe, expect, it } from "vitest";
import { socialQrSchema } from "@/lib/validation/qr";
import { buildSocialPayload } from "@/lib/qr/payload-builders";

describe("socialQrSchema", () => {
  it("accepts a title with at least one link", () => {
    const result = socialQrSchema.safeParse({
      title: "My Business",
      links: [{ label: "Website", url: "example.com" }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.links[0].url).toBe("https://example.com");
  });

  it("accepts a title with only a social icon, no links", () => {
    const result = socialQrSchema.safeParse({
      title: "My Business",
      icons: [{ platform: "instagram", url: "https://instagram.com/example" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a title with no links and no icons", () => {
    expect(socialQrSchema.safeParse({ title: "My Business" }).success).toBe(false);
  });

  it("defaults theme to light", () => {
    const result = socialQrSchema.safeParse({
      title: "My Business",
      links: [{ label: "Website", url: "https://example.com" }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.theme).toBe("light");
  });

  it("rejects an unknown icon platform", () => {
    const result = socialQrSchema.safeParse({
      title: "My Business",
      icons: [{ platform: "myspace", url: "https://example.com" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("buildSocialPayload", () => {
  it("returns the title — never actually encoded into a QR image", () => {
    expect(
      buildSocialPayload({
        title: "My Business",
        avatarUrl: undefined,
        links: [],
        icons: [],
        theme: "light",
      }),
    ).toBe("My Business");
  });
});
