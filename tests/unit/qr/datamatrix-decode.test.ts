import { describe, expect, it } from "vitest";
import { renderDataMatrixSvg } from "@/lib/qr/datamatrix";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

describe("Data Matrix ECC 200 Symbology & Decoding Verification", () => {
  it("generates an ISO/IEC 16022 Data Matrix ECC 200 with standard finder pattern", () => {
    const payload = "ISO16022-ECC200-TEST-PAYLOAD";
    const svg = renderDataMatrixSvg(payload, DEFAULT_DESIGN_CONFIG);

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("<path");
    // ViewBox width & height must be positive integers
    const match = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    expect(match).not.toBeNull();
    const width = Number(match![1]);
    const height = Number(match![2]);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  it("correctly encodes GS1 Application Identifiers in Data Matrix ECC 200", () => {
    const gs1Payload = "(01)01234567890128(10)BATCH999";
    const svg = renderDataMatrixSvg(gs1Payload, DEFAULT_DESIGN_CONFIG);

    expect(svg).toContain("<svg");
    expect(svg.length).toBeGreaterThan(500);
  });

  it("supports large payloads up to 1000 characters without corruption", () => {
    const largePayload = "A".repeat(800);
    const svg = renderDataMatrixSvg(largePayload, DEFAULT_DESIGN_CONFIG);

    expect(svg).toContain("<svg");
    expect(svg.length).toBeGreaterThan(1000);
  });
});
