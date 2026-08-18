import { describe, expect, it } from "vitest";
import { renderStyledQrSvg } from "@/lib/qr/styled-svg";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

const PAYLOAD = "https://example.com";

describe("renderStyledQrSvg", () => {
  it("renders valid, well-formed SVG for the default design", async () => {
    const { svg, warnings } = await renderStyledQrSvg(PAYLOAD, DEFAULT_DESIGN_CONFIG);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(warnings).toEqual([]);
  });

  it("uses circle shapes for the dots pattern style", async () => {
    const design = { ...DEFAULT_DESIGN_CONFIG, pattern: { dotStyle: "dots" } };
    const { svg } = await renderStyledQrSvg(PAYLOAD, design);
    expect(svg).toContain("<circle");
  });

  it("uses rounded rects for the rounded pattern style", async () => {
    const design = { ...DEFAULT_DESIGN_CONFIG, pattern: { dotStyle: "rounded" } };
    const { svg } = await renderStyledQrSvg(PAYLOAD, design);
    expect(svg).toMatch(/<rect[^>]*rx="[1-9]/);
  });

  it("applies distinct eye colors separately from the data-module color", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      eyes: {
        ...DEFAULT_DESIGN_CONFIG.eyes,
        cornerSquareColor: "#ff0000",
        cornerDotColor: "#00ff00",
      },
    };
    const { svg } = await renderStyledQrSvg(PAYLOAD, design);
    expect(svg).toContain("#ff0000");
    expect(svg).toContain("#00ff00");
  });

  it("adds a gradient definition when a gradient is configured", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      colors: {
        ...DEFAULT_DESIGN_CONFIG.colors,
        gradient: { mode: "linear" as const, colors: ["#111111", "#222222"] as [string, string] },
      },
    };
    const { svg } = await renderStyledQrSvg(PAYLOAD, design);
    expect(svg).toContain("<linearGradient");
    expect(svg).toContain("url(#qr-fg-gradient)");
  });

  it("warns when foreground/background contrast is too low", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      colors: { ...DEFAULT_DESIGN_CONFIG.colors, foreground: "#f0f0f0", background: "#ffffff" },
    };
    const { warnings } = await renderStyledQrSvg(PAYLOAD, design);
    expect(warnings.some((w) => w.includes("contrast"))).toBe(true);
  });

  it("clamps an out-of-range logo size and warns about it", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      logo: {
        ...DEFAULT_DESIGN_CONFIG.logo,
        assetUrl: "data:image/png;base64,AAAA",
        sizeRatio: 0.9,
      },
    };
    const { warnings } = await renderStyledQrSvg(PAYLOAD, design);
    expect(warnings.some((w) => w.includes("Logo size"))).toBe(true);
  });

  it("embeds the logo image when set", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      logo: { ...DEFAULT_DESIGN_CONFIG.logo, assetUrl: "data:image/png;base64,AAAA" },
    };
    const { svg } = await renderStyledQrSvg(PAYLOAD, design);
    expect(svg).toContain("<image");
    expect(svg).toContain("data:image/png;base64,AAAA");
  });

  it("does not render a logo image when none is set", async () => {
    const { svg } = await renderStyledQrSvg(PAYLOAD, DEFAULT_DESIGN_CONFIG);
    expect(svg).not.toContain("<image");
  });

  it("omits the background fill entirely when transparentBackground is set (Module 3.4 acceptance criterion)", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      colors: { ...DEFAULT_DESIGN_CONFIG.colors, transparentBackground: true },
    };
    const { svg } = await renderStyledQrSvg(PAYLOAD, design);
    // No rect covering the QR area in the default background color — a
    // transparent canvas, not a rect painted the "wrong" transparent color.
    expect(svg).not.toContain(DEFAULT_DESIGN_CONFIG.colors.background);
  });

  it("renders a frame border and escaped CTA text for the simple frame style", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      frame: { style: "simple", ctaText: "Scan <me> & save", ctaFont: null, color: "#0f766e" },
    };
    const { svg } = await renderStyledQrSvg(PAYLOAD, design);
    expect(svg).toContain("#0f766e");
    expect(svg).toContain("Scan &lt;me&gt; &amp; save");
    expect(svg).not.toContain("<me>");
  });

  it("renders a badge bar below the QR for the badge frame style", async () => {
    const withBadge = await renderStyledQrSvg(PAYLOAD, {
      ...DEFAULT_DESIGN_CONFIG,
      frame: { style: "badge", ctaText: "Scan me", ctaFont: null, color: "#0f766e" },
    });
    const withoutFrame = await renderStyledQrSvg(PAYLOAD, DEFAULT_DESIGN_CONFIG);

    const heightOf = (svg: string) => Number(svg.match(/height="(\d+(?:\.\d+)?)"/)?.[1]);
    expect(heightOf(withBadge.svg)).toBeGreaterThan(heightOf(withoutFrame.svg));
  });

  it("renders no frame chrome when frame.style is null", async () => {
    const { svg } = await renderStyledQrSvg(PAYLOAD, DEFAULT_DESIGN_CONFIG);
    expect(svg).not.toContain("<text");
  });

  it("falls back to the plain renderer if the styled path throws", async () => {
    const brokenDesign = {
      ...DEFAULT_DESIGN_CONFIG,
      pattern: null as unknown as { dotStyle: string },
    };
    const { svg, warnings } = await renderStyledQrSvg(PAYLOAD, brokenDesign);
    expect(svg).toContain("<svg");
    expect(warnings.some((w) => w.includes("simplified"))).toBe(true);
  });
});
