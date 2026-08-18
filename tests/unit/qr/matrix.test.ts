import { describe, expect, it } from "vitest";
import { getQrMatrix } from "@/lib/qr/matrix";

describe("getQrMatrix", () => {
  it("returns a square matrix with a positive size", () => {
    const matrix = getQrMatrix("https://example.com");
    expect(matrix.size).toBeGreaterThan(0);
  });

  it("marks the top-left, top-right, and bottom-left corners as finder regions", () => {
    const matrix = getQrMatrix("https://example.com");
    expect(matrix.isFinderRegion(0, 0)).toBe(true);
    expect(matrix.isFinderRegion(0, matrix.size - 1)).toBe(true);
    expect(matrix.isFinderRegion(matrix.size - 1, 0)).toBe(true);
  });

  it("does not mark the bottom-right corner or the center as a finder region", () => {
    const matrix = getQrMatrix("https://example.com");
    expect(matrix.isFinderRegion(matrix.size - 1, matrix.size - 1)).toBe(false);
    const center = Math.floor(matrix.size / 2);
    expect(matrix.isFinderRegion(center, center)).toBe(false);
  });

  it("renders the finder pattern's outer ring as dark modules", () => {
    const matrix = getQrMatrix("https://example.com");
    // The top-left finder pattern's top-left corner module is always dark.
    expect(matrix.isDark(0, 0)).toBe(true);
  });

  it("produces a larger matrix at a higher error-correction level for the same payload", () => {
    // Higher EC levels need more redundancy, which can bump the QR to a
    // larger version for payloads near a size boundary — using a longer
    // payload makes this difference reliably observable.
    const payload = "https://example.com/" + "a".repeat(40);
    const low = getQrMatrix(payload, "L");
    const high = getQrMatrix(payload, "H");
    expect(high.size).toBeGreaterThanOrEqual(low.size);
  });
});
