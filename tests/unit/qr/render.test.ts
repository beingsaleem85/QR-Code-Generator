import { describe, expect, it } from "vitest";
import {
  buildQrPayload,
  renderQrPngDataUrl,
  renderQrSvg,
  resolveEncodedPayload,
  slugifyForFilename,
} from "@/lib/qr/render";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

describe("buildQrPayload", () => {
  it("builds a payload for valid content", () => {
    expect(buildQrPayload("url", { url: "example.com" })).toBe("https://example.com");
  });

  it("returns null for invalid/incomplete content", () => {
    expect(buildQrPayload("url", { url: "" })).toBeNull();
    expect(buildQrPayload("wifi", { ssid: "", encryption: "nopass" })).toBeNull();
  });

  it("returns null for a type with no payload builder yet", () => {
    expect(buildQrPayload("images", {})).toBeNull();
  });

  it("returns null for pdf content before a file has actually been uploaded", () => {
    expect(buildQrPayload("pdf", {})).toBeNull();
  });

  it("preserves Unicode content in the built payload", () => {
    const payload = buildQrPayload("wifi", {
      ssid: "Café Wi-Fi 日本語",
      encryption: "nopass",
    });
    expect(payload).toContain("Café Wi-Fi 日本語");
  });
});

describe("resolveEncodedPayload", () => {
  it("encodes the raw content payload for a static QR", () => {
    expect(resolveEncodedPayload("static", "url", { url: "example.com" })).toBe(
      "https://example.com",
    );
  });

  it("encodes the app's own /r/[slug] redirect URL for a dynamic QR with a slug", () => {
    const payload = resolveEncodedPayload("dynamic", "url", { url: "example.com" }, "abc12345");
    expect(payload).toMatch(/\/r\/abc12345$/);
    expect(payload).not.toContain("example.com");
  });

  it("returns null for a dynamic QR with no slug yet (not saved once)", () => {
    expect(resolveEncodedPayload("dynamic", "url", { url: "example.com" }, null)).toBeNull();
    expect(resolveEncodedPayload("dynamic", "url", { url: "example.com" })).toBeNull();
  });

  it("encodes /p/[slug] instead of /r/[slug] for a needsLandingPage type (pdf)", () => {
    const payload = resolveEncodedPayload("dynamic", "pdf", {}, "abc12345");
    expect(payload).toMatch(/\/p\/abc12345$/);
  });

  it("returns null for a landing-page type with no slug yet", () => {
    expect(resolveEncodedPayload("dynamic", "pdf", {}, null)).toBeNull();
  });

  it("ignores content entirely once a dynamic QR has a slug", () => {
    const withInvalidContent = resolveEncodedPayload("dynamic", "url", {}, "abc12345");
    expect(withInvalidContent).toMatch(/\/r\/abc12345$/);
  });
});

describe("renderQrSvg / renderQrPngDataUrl", () => {
  it("renders valid SVG markup for a plain payload", async () => {
    const svg = await renderQrSvg("https://example.com", DEFAULT_DESIGN_CONFIG);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("renders a Unicode payload without throwing", async () => {
    const svg = await renderQrSvg("Café Wi-Fi 日本語", DEFAULT_DESIGN_CONFIG);
    expect(svg).toContain("<svg");
  });

  it("applies the design's foreground/background colors", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      colors: { ...DEFAULT_DESIGN_CONFIG.colors, foreground: "#123456", background: "#abcdef" },
    };
    const svg = await renderQrSvg("https://example.com", design);
    expect(svg).toContain("#123456");
  });

  it("makes the background transparent when transparentBackground is set", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      colors: { ...DEFAULT_DESIGN_CONFIG.colors, transparentBackground: true },
    };
    const svg = await renderQrSvg("https://example.com", design);
    expect(svg).not.toContain("#ffffff");
  });

  it("renders a PNG data URL", async () => {
    const dataUrl = await renderQrPngDataUrl("https://example.com", DEFAULT_DESIGN_CONFIG);
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});

describe("slugifyForFilename", () => {
  it("lowercases and hyphenates a normal name", () => {
    expect(slugifyForFilename("Restaurant Menu")).toBe("restaurant-menu");
  });

  it("collapses non-alphanumeric runs and trims edges", () => {
    expect(slugifyForFilename("  Summer Sale!! 2026  ")).toBe("summer-sale-2026");
  });

  it("falls back to a default for an empty/unusable name", () => {
    expect(slugifyForFilename("   ")).toBe("qr-code");
    expect(slugifyForFilename("!!!")).toBe("qr-code");
  });

  it("strips diacritics down to their base letters instead of dropping them", () => {
    expect(slugifyForFilename("Café Menu")).toBe("cafe-menu");
  });

  it("falls back when the name has no ASCII-representable characters at all", () => {
    expect(slugifyForFilename("日本語")).toBe("qr-code");
  });

  it("caps length rather than producing an unbounded filename", () => {
    const slug = slugifyForFilename("a".repeat(200));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("a bare reserved Windows device name still slugifies (callers always append a suffix)", () => {
    expect(slugifyForFilename("CON")).toBe("con");
  });
});
