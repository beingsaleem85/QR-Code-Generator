import { describe, expect, it } from "vitest";
import { pdfQrSchema } from "@/lib/validation/qr";
import { buildPdfPayload } from "@/lib/qr/payload-builders";

describe("pdfQrSchema", () => {
  it("accepts a complete, real upload result", () => {
    const result = pdfQrSchema.safeParse({
      path: "user-1/asset-1/menu.pdf",
      fileName: "menu.pdf",
      sizeBytes: 12345,
      mimeType: "application/pdf",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when no file has been uploaded yet", () => {
    expect(pdfQrSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an unreasonably long fileName (Module 3.12)", () => {
    const result = pdfQrSchema.safeParse({
      path: "user-1/asset-1/menu.pdf",
      fileName: "x".repeat(256),
      sizeBytes: 1,
      mimeType: "application/pdf",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-PDF mime type", () => {
    const result = pdfQrSchema.safeParse({
      path: "user-1/asset-1/menu.pdf",
      fileName: "menu.pdf",
      sizeBytes: 12345,
      mimeType: "image/png",
    });
    expect(result.success).toBe(false);
  });
});

describe("buildPdfPayload", () => {
  it("returns the storage path", () => {
    expect(
      buildPdfPayload({
        path: "user-1/asset-1/menu.pdf",
        fileName: "menu.pdf",
        sizeBytes: 1,
        mimeType: "application/pdf",
      }),
    ).toBe("user-1/asset-1/menu.pdf");
  });
});
