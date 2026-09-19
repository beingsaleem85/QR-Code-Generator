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

  it("uses fine circle shapes for the fine-dots pattern style", async () => {
    const design = { ...DEFAULT_DESIGN_CONFIG, pattern: { dotStyle: "fine-dots" } };
    const { svg } = await renderStyledQrSvg(PAYLOAD, design);
    expect(svg).toContain("<circle");
    // Fine dots have a radius of (CELL / 2) * 0.58 = 2.9
    expect(svg).toContain('r="2.9"');
  });

  it("uses rounded rects for the rounded pattern style", async () => {
    const design = { ...DEFAULT_DESIGN_CONFIG, pattern: { dotStyle: "rounded" } };
    const { svg } = await renderStyledQrSvg(PAYLOAD, design);
    expect(svg).toMatch(/<rect[^>]*rx="[1-9]/);
  });

  it("supports diamond corner dot eye style", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      eyes: { ...DEFAULT_DESIGN_CONFIG.eyes, cornerDotStyle: "diamond" },
    };
    const { svg } = await renderStyledQrSvg(PAYLOAD, design);
    expect(svg).toContain("<polygon");
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

  it("uses fine circle shapes for the micro-dots pattern style", async () => {
    const design = { ...DEFAULT_DESIGN_CONFIG, pattern: { dotStyle: "micro-dots" } };
    const { svg } = await renderStyledQrSvg(PAYLOAD, design);
    expect(svg).toContain("<circle");
    // Micro dots have a radius of (CELL / 2) * 0.42 = 2.1
    expect(svg).toContain('r="2.1"');
  });

  it("renders boxed frame style with bordered frame and bottom CTA", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      frame: { style: "boxed", ctaText: "SCAN ME", ctaFont: null, color: "#000000" },
    };
    const { svg } = await renderStyledQrSvg(PAYLOAD, design);
    expect(svg).toContain("SCAN ME");
    expect(svg).toContain('rx="6"');
  });

  it("renders split frame style with top header and bottom CTA banner", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      frame: { style: "split", ctaText: "SCAN ME", ctaFont: null, color: "#000000" },
    };
    const { svg } = await renderStyledQrSvg(PAYLOAD, design);
    expect(svg).toContain("SCAN ME");
  });

  it("renders poster frame style with card background and pill CTA", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      frame: { style: "poster", ctaText: "SCAN ME", ctaFont: null, color: "#000000" },
    };
    const { svg } = await renderStyledQrSvg(PAYLOAD, design);
    expect(svg).toContain("SCAN ME");
    expect(svg).toContain('opacity="0.12"');
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

  it("applies exactly 10px outer white padding on all sides (Top, Right, Bottom, Left)", async () => {
    const { svg } = await renderStyledQrSvg(PAYLOAD, DEFAULT_DESIGN_CONFIG);

    // Extract viewBox width & height
    const viewBoxMatch = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    expect(viewBoxMatch).not.toBeNull();
    const width = Number(viewBoxMatch![1]);
    const height = Number(viewBoxMatch![2]);

    // Top-left finder outer rect is at x=10+5=15, y=10+5=15 with stroke-width=10,
    // so its visual outer edge starts at exactly x=10, y=10 (giving 10px top & left padding)
    expect(svg).toContain('<rect x="15" y="15" width="60" height="60"');

    // White background rect matches exact viewBox width & height
    expect(svg).toContain(`<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />`);

    // The QR size in modules is (width - 20) / 10
    const qrSize = width - 20;
    expect(qrSize % 10).toBe(0);

    // Top-right finder outer rect is at x = 10 + (qrSize - 70) + 5 = qrSize - 55.
    // Outer edge is at (qrSize - 55) + 65 = qrSize + 10.
    // Margin to right edge (width = qrSize + 20): (qrSize + 20) - (qrSize + 10) = 10px!
    const trX = 10 + qrSize - 70 + 5;
    expect(svg).toContain(`<rect x="${trX}" y="15" width="60" height="60"`);
  });

  it("normalizes existing/legacy QR configurations with custom margin properties to 10px outer padding", async () => {
    const legacyDesignWithMargin = {
      ...DEFAULT_DESIGN_CONFIG,
      margin: 40,
      quietZone: 8,
      padding: 50,
    } as unknown as typeof DEFAULT_DESIGN_CONFIG;

    const { svg } = await renderStyledQrSvg(PAYLOAD, legacyDesignWithMargin);

    // Must still use exactly 10px offset (x=15, y=15 with stroke 10)
    expect(svg).toContain('<rect x="15" y="15" width="60" height="60"');
  });
});
