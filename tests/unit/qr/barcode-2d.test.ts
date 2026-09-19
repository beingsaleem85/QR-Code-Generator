import { describe, expect, it } from "vitest";
import { barcode2dQrSchema } from "@/lib/validation/qr/barcode-2d";
import { buildBarcode2dPayload } from "@/lib/qr/payload-builders/barcode-2d";
import { renderDataMatrixSvg } from "@/lib/qr/datamatrix";
import { renderStyledQrSvg } from "@/lib/qr/styled-svg";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

describe("2D Barcode (Data Matrix ECC 200)", () => {
  describe("schema validation", () => {
    it("accepts valid text data", () => {
      const result = barcode2dQrSchema.safeParse({ data: "TEST-12345" });
      expect(result.success).toBe(true);
    });

    it("rejects empty data", () => {
      const result = barcode2dQrSchema.safeParse({ data: "" });
      expect(result.success).toBe(false);
    });

    it("rejects data exceeding 1000 characters", () => {
      const longData = "A".repeat(1001);
      const result = barcode2dQrSchema.safeParse({ data: longData });
      expect(result.success).toBe(false);
    });

    it("accepts maximum 1000 characters", () => {
      const maxData = "A".repeat(1000);
      const result = barcode2dQrSchema.safeParse({ data: maxData });
      expect(result.success).toBe(true);
    });

    it("supports GS1 encoding standard", () => {
      const result = barcode2dQrSchema.safeParse({
        data: "(01)01234567890128(10)ABC123",
        encoding: "gs1",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("payload builder", () => {
    it("returns raw payload data", () => {
      expect(buildBarcode2dPayload({ data: "DM-SAMPLE", encoding: "standard" })).toBe("DM-SAMPLE");
    });
  });

  describe("Data Matrix ECC 200 generator", () => {
    it("generates a valid SVG with viewBox and path elements", () => {
      const svg = renderDataMatrixSvg("ISO-16022-DATAMATRIX", DEFAULT_DESIGN_CONFIG);
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain("viewBox=");
      expect(svg).toContain("<path");
    });

    it("applies custom foreground colors to the barcode modules", () => {
      const customDesign = {
        ...DEFAULT_DESIGN_CONFIG,
        colors: {
          ...DEFAULT_DESIGN_CONFIG.colors,
          foreground: "#0f766e",
          background: "#ffffff",
        },
      };
      const svg = renderDataMatrixSvg("COLOR-TEST", customDesign);
      expect(svg.toLowerCase()).toContain("0f766e");
    });

    it("throws an error for empty payload in generator", () => {
      expect(() => renderDataMatrixSvg("")).toThrow();
    });

    it("renders via renderStyledQrSvg with qrType barcode_2d", async () => {
      const result = await renderStyledQrSvg("TEST-BARCODE-PAYLOAD", DEFAULT_DESIGN_CONFIG, "barcode_2d");
      expect(result.svg).toContain("<svg");
      expect(result.svg).toContain("</svg>");
      expect(result.warnings).toEqual([]);
    });

    it("warns when color contrast is insufficient", async () => {
      const lowContrastDesign = {
        ...DEFAULT_DESIGN_CONFIG,
        colors: {
          ...DEFAULT_DESIGN_CONFIG.colors,
          foreground: "#e2e8f0",
          background: "#ffffff",
          transparentBackground: false,
        },
      };
      const result = await renderStyledQrSvg("CONTRAST-TEST", lowContrastDesign, "barcode_2d");
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].toLowerCase()).toContain("contrast");
    });
  });
});
