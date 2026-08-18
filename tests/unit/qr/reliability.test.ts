import { describe, expect, it } from "vitest";
import {
  clampLogoSizeRatio,
  getContrastRatio,
  getContrastWarning,
  getRecommendedErrorCorrectionLevel,
  LOGO_SIZE_RATIO_RANGE,
} from "@/lib/qr/reliability";

describe("getContrastRatio / getContrastWarning", () => {
  it("gives black-on-white the maximum possible ratio", () => {
    expect(getContrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("gives identical colors a ratio of 1", () => {
    expect(getContrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
  });

  it("does not warn for strong contrast", () => {
    expect(getContrastWarning("#000000", "#ffffff")).toBeNull();
  });

  it("warns for near-identical colors", () => {
    expect(getContrastWarning("#f0f0f0", "#ffffff")).not.toBeNull();
  });
});

describe("clampLogoSizeRatio", () => {
  it("leaves an in-range value untouched", () => {
    expect(clampLogoSizeRatio(0.2)).toBe(0.2);
  });

  it("clamps below the minimum", () => {
    expect(clampLogoSizeRatio(0.01)).toBe(LOGO_SIZE_RATIO_RANGE.min);
  });

  it("clamps above the maximum", () => {
    expect(clampLogoSizeRatio(0.9)).toBe(LOGO_SIZE_RATIO_RANGE.max);
  });
});

describe("getRecommendedErrorCorrectionLevel", () => {
  it("recommends M without a logo", () => {
    expect(getRecommendedErrorCorrectionLevel(false)).toBe("M");
  });

  it("recommends H with a logo, for scan reliability", () => {
    expect(getRecommendedErrorCorrectionLevel(true)).toBe("H");
  });
});
