import { describe, expect, it } from "vitest";
import {
  clampZoomPercent,
  sanitizePdfFileName,
  ZOOM_MAX_PERCENT,
  ZOOM_MIN_PERCENT,
} from "@/lib/qr/pdf-viewer-utils";

describe("sanitizePdfFileName", () => {
  it("keeps an already-clean name with spaces and hyphens intact", () => {
    expect(sanitizePdfFileName("employment-offer letter.pdf")).toBe("employment-offer letter.pdf");
  });

  it("appends .pdf when the name is missing the extension", () => {
    expect(sanitizePdfFileName("employment offer letter")).toBe("employment offer letter.pdf");
  });

  it("strips path separators and reserved filename characters", () => {
    expect(sanitizePdfFileName('../../etc/passwd:*?"<>|.pdf')).toBe("....etcpasswd.pdf");
  });

  it("strips control characters", () => {
    expect(sanitizePdfFileName("bad\x00name\x1f.pdf")).toBe("badname.pdf");
  });

  it("falls back to document.pdf for null/undefined/empty input", () => {
    expect(sanitizePdfFileName(null)).toBe("document.pdf");
    expect(sanitizePdfFileName(undefined)).toBe("document.pdf");
    expect(sanitizePdfFileName("")).toBe("document.pdf");
  });

  it("falls back to document.pdf when sanitizing removes everything", () => {
    expect(sanitizePdfFileName("///:::")).toBe("document.pdf");
  });

  it("is case-insensitive about an existing .pdf extension", () => {
    expect(sanitizePdfFileName("report.PDF")).toBe("report.PDF");
  });
});

describe("clampZoomPercent", () => {
  it("passes through values already in range", () => {
    expect(clampZoomPercent(125)).toBe(125);
  });

  it("clamps below the minimum", () => {
    expect(clampZoomPercent(10)).toBe(ZOOM_MIN_PERCENT);
  });

  it("clamps above the maximum", () => {
    expect(clampZoomPercent(500)).toBe(ZOOM_MAX_PERCENT);
  });
});
