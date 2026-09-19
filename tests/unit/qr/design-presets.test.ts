import { describe, expect, it } from "vitest";
import { DESIGN_PRESETS } from "@/lib/qr/design-presets";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

describe("QR Design Presets & Defaults (v8.4)", () => {
  it("DEFAULT_DESIGN_CONFIG defaults to black foreground and white background", () => {
    expect(DEFAULT_DESIGN_CONFIG.colors.foreground).toBe("#000000");
    expect(DEFAULT_DESIGN_CONFIG.colors.background).toBe("#ffffff");
    expect(DEFAULT_DESIGN_CONFIG.eyes.cornerSquareColor).toBe("#000000");
    expect(DEFAULT_DESIGN_CONFIG.eyes.cornerDotColor).toBe("#000000");
    expect(DEFAULT_DESIGN_CONFIG.frame.color).toBe("#000000");
  });

  it("every preset in DESIGN_PRESETS defaults to black foreground (#000000)", () => {
    for (const preset of DESIGN_PRESETS) {
      expect(
        preset.design.colors.foreground,
        `Preset "${preset.name}" foreground must be #000000`,
      ).toBe("#000000");
      expect(
        preset.design.colors.background,
        `Preset "${preset.name}" background must be #ffffff`,
      ).toBe("#ffffff");
      expect(
        preset.design.eyes.cornerSquareColor,
        `Preset "${preset.name}" eye corner square must be #000000`,
      ).toBe("#000000");
      expect(
        preset.design.eyes.cornerDotColor,
        `Preset "${preset.name}" eye corner dot must be #000000`,
      ).toBe("#000000");
      expect(
        preset.design.frame.color,
        `Preset "${preset.name}" frame color must be #000000`,
      ).toBe("#000000");
    }
  });

  it("includes the SS2 micro-dots preset", () => {
    const microDots = DESIGN_PRESETS.find((p) => p.id === "micro-dots");
    expect(microDots).toBeDefined();
    expect(microDots?.design.pattern.dotStyle).toBe("micro-dots");
    expect(microDots?.design.colors.foreground).toBe("#000000");
  });

  it("includes all SS3 framed / CTA-driven presets with SCAN ME text", () => {
    const scanBadge = DESIGN_PRESETS.find((p) => p.id === "scan-badge");
    expect(scanBadge).toBeDefined();
    expect(scanBadge?.design.frame.style).toBe("badge");
    expect(scanBadge?.design.frame.ctaText).toBe("SCAN ME");

    const boxedFrame = DESIGN_PRESETS.find((p) => p.id === "boxed-frame");
    expect(boxedFrame).toBeDefined();
    expect(boxedFrame?.design.frame.style).toBe("boxed");
    expect(boxedFrame?.design.frame.ctaText).toBe("SCAN ME");

    const splitCard = DESIGN_PRESETS.find((p) => p.id === "split-card");
    expect(splitCard).toBeDefined();
    expect(splitCard?.design.frame.style).toBe("split");
    expect(splitCard?.design.frame.ctaText).toBe("SCAN ME");

    const posterStyle = DESIGN_PRESETS.find((p) => p.id === "poster-style");
    expect(posterStyle).toBeDefined();
    expect(posterStyle?.design.frame.style).toBe("poster");
    expect(posterStyle?.design.frame.ctaText).toBe("SCAN ME");
  });
});
