import { describe, expect, it } from "vitest";
import { getQrMatrix, QrCapacityError } from "@/lib/qr/matrix";
import { renderStyledQrSvg } from "@/lib/qr/styled-svg";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";
import { DESIGN_PRESETS } from "@/lib/qr/design-presets";
import type { QRErrorCorrectionLevel } from "@/types/qr-design";

describe("QR Code Version 10, 25, and 40 Standards-Compliant Encoding", () => {
  it("Version 10 produces exactly 57 x 57 modules according to formula 21 + 4 * (10 - 1)", () => {
    const payload = "https://example.com/test-version-10";
    const matrix = getQrMatrix(payload, "M", 10);

    expect(matrix.version).toBe(10);
    expect(matrix.size).toBe(57);
    expect(matrix.size).toBe(21 + 4 * (10 - 1));
  });

  it("Version 25 produces exactly 117 x 117 modules according to formula 21 + 4 * (25 - 1)", () => {
    const payload = "https://example.com/test-version-25";
    const matrix = getQrMatrix(payload, "M", 25);

    expect(matrix.version).toBe(25);
    expect(matrix.size).toBe(117);
    expect(matrix.size).toBe(21 + 4 * (25 - 1));
  });

  it("Version 40 produces exactly 177 x 177 modules according to formula 21 + 4 * (40 - 1)", () => {
    const payload = "https://example.com/test-version-40";
    const matrix = getQrMatrix(payload, "M", 40);

    expect(matrix.version).toBe(40);
    expect(matrix.size).toBe(177);
    expect(matrix.size).toBe(21 + 4 * (40 - 1));
  });

  it("Auto mode automatically selects the smallest valid version for the payload", () => {
    // Short payload fits in small QR versions (e.g. Version 1 or 2)
    const shortPayload = "HELLO";
    const autoSmall = getQrMatrix(shortPayload, "M", "auto");
    expect(autoSmall.version).toBeLessThan(10);
    expect(autoSmall.size).toBeLessThan(57);

    // Medium payload selects an appropriate version
    const mediumPayload = "https://qrforge.space/very/long/url/path/with/lots/of/parameters?a=1&b=2&c=3";
    const autoMedium = getQrMatrix(mediumPayload, "M", "auto");
    expect(autoMedium.size).toBe(21 + 4 * (autoMedium.version - 1));
  });

  it("works across all supported error correction levels (L, M, Q, H) for Versions 10, 25, and 40", () => {
    const ecLevels: QRErrorCorrectionLevel[] = ["L", "M", "Q", "H"];
    const payload = "STANDARDS-COMPLIANT-EC-TEST";

    for (const ec of ecLevels) {
      const v10 = getQrMatrix(payload, ec, 10);
      expect(v10.size).toBe(57);
      expect(v10.version).toBe(10);

      const v25 = getQrMatrix(payload, ec, 25);
      expect(v25.size).toBe(117);
      expect(v25.version).toBe(25);

      const v40 = getQrMatrix(payload, ec, 40);
      expect(v40.size).toBe(177);
      expect(v40.version).toBe(40);
    }
  });

  it("throws specific QrCapacityError with guidance when content exceeds Version 10 capacity", () => {
    const hugePayload = "A".repeat(800);

    expect(() => getQrMatrix(hugePayload, "H", 10)).toThrow(QrCapacityError);
    try {
      getQrMatrix(hugePayload, "H", 10);
    } catch (err) {
      expect(err).toBeInstanceOf(QrCapacityError);
      expect((err as QrCapacityError).message).toBe(
        "This content is too large for QR Version 10 with the selected error-correction level. Reduce the content, lower the error-correction level, select Version 25 or Version 40, or use Auto version.",
      );
    }
  });

  it("throws specific QrCapacityError with guidance when content exceeds Version 25 capacity", () => {
    const hugePayload = "B".repeat(2500);

    expect(() => getQrMatrix(hugePayload, "H", 25)).toThrow(QrCapacityError);
    try {
      getQrMatrix(hugePayload, "H", 25);
    } catch (err) {
      expect(err).toBeInstanceOf(QrCapacityError);
      expect((err as QrCapacityError).message).toBe(
        "This content is too large for QR Version 25 with the selected error-correction level. Reduce the content, lower the error-correction level, select Version 40, or use Auto version.",
      );
    }
  });

  it("throws specific QrCapacityError with guidance when content exceeds Version 40 capacity", () => {
    const hugePayload = "C".repeat(4000);

    expect(() => getQrMatrix(hugePayload, "H", 40)).toThrow(QrCapacityError);
    try {
      getQrMatrix(hugePayload, "H", 40);
    } catch (err) {
      expect(err).toBeInstanceOf(QrCapacityError);
      expect((err as QrCapacityError).message).toBe(
        "This content is too large for QR Version 40 with the selected error-correction level. Reduce the content or lower the error-correction level.",
      );
    }
  });

  it("renderStyledQrSvg surfaces capacity errors cleanly without throwing or silent version fallback", async () => {
    const hugePayload = "A".repeat(800);
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      version: 10 as const,
    };

    const result = await renderStyledQrSvg(hugePayload, design);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("This content is too large for QR Version 10");
    expect(result.svg).toBe("");
  });

  it("identifies and protects functional/reserved modules (timing, alignment, version info)", () => {
    const matrixV10 = getQrMatrix("PROTECTION-TEST", "M", 10);

    // Row 6 is horizontal timing pattern
    expect(matrixV10.isReserved(6, 10)).toBe(true);
    // Col 6 is vertical timing pattern
    expect(matrixV10.isReserved(10, 6)).toBe(true);

    // Finder corners are reserved
    expect(matrixV10.isReserved(0, 0)).toBe(true);
    expect(matrixV10.isReserved(0, 56)).toBe(true);
    expect(matrixV10.isReserved(56, 0)).toBe(true);

    // An ordinary data module is NOT reserved
    expect(matrixV10.isReserved(10, 10)).toBe(false);
  });

  it("protects functional modules from custom dotStyle in styled SVG", async () => {
    const designWithMicroDots = {
      ...DEFAULT_DESIGN_CONFIG,
      version: 10 as const,
      pattern: { dotStyle: "micro-dots" },
    };

    const { svg, error } = await renderStyledQrSvg("https://example.com/alignment", designWithMicroDots);
    expect(error).toBeUndefined();
    expect(svg).toContain("<svg");

    // Both circles (for styled data modules) AND rects (for protected functional modules) must exist
    expect(svg).toContain("<circle");
    expect(svg).toContain("<rect");
  });

  it("renders all 10 design presets successfully with Version 10, 25, and 40", async () => {
    const versions = [10, 25, 40] as const;

    for (const v of versions) {
      for (const preset of DESIGN_PRESETS) {
        const design = {
          ...preset.design,
          version: v,
          logo: { assetUrl: null, sizeRatio: 0.2, whiteMargin: true },
        };

        const { svg, error, matrixSize } = await renderStyledQrSvg("https://qrforge.space/preset-test", design);
        expect(error).toBeUndefined();
        expect(svg).toContain("<svg");
        expect(svg).toContain("</svg>");
        expect(matrixSize).toBe(21 + 4 * (v - 1));
      }
    }
  });

  it("encodes various QR content types cleanly in Version 10, 25, and 40", async () => {
    const contentPayloads = [
      "Plain text content example",
      "https://example.com/subpath?query=val",
      "WIFI:T:WPA;S:MyNetwork;P:MyPassword;;",
      "BEGIN:VCARD\nVERSION:3.0\nN:Doe;John\nFN:John Doe\nTEL;TYPE=CELL:1234567890\nEMAIL:john@example.com\nEND:VCARD",
      "mailto:user@example.com?subject=Hello&body=World",
      "tel:+1234567890",
      "smsto:+1234567890:Hello there",
    ];

    for (const payload of contentPayloads) {
      const v10 = getQrMatrix(payload, "M", 10);
      expect(v10.size).toBe(57);

      const v25 = getQrMatrix(payload, "M", 25);
      expect(v25.size).toBe(117);

      const v40 = getQrMatrix(payload, "M", 40);
      expect(v40.size).toBe(177);
    }
  });
});
