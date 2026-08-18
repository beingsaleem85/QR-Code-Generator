// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderStyledQrPngDataUrl } from "@/lib/qr/styled-svg";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

// jsdom doesn't implement real image loading or a canvas 2D context —
// mocked here so the conversion pipeline itself (not the browser APIs it
// calls) is what's under test.
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();

  class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) {
      queueMicrotask(() => this.onload?.());
    }
  }
  vi.stubGlobal("Image", MockImage);

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,MOCK");
});

describe("renderStyledQrPngDataUrl", () => {
  it("produces a PNG data URL", async () => {
    const { dataUrl } = await renderStyledQrPngDataUrl(
      "https://example.com",
      DEFAULT_DESIGN_CONFIG,
    );
    expect(dataUrl).toBe("data:image/png;base64,MOCK");
  });

  it("creates and revokes exactly one intermediate object URL", async () => {
    await renderStyledQrPngDataUrl("https://example.com", DEFAULT_DESIGN_CONFIG);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
  });

  it("still revokes the object URL if canvas drawing fails", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    await expect(
      renderStyledQrPngDataUrl("https://example.com", DEFAULT_DESIGN_CONFIG),
    ).rejects.toThrow();
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
  });

  it("surfaces reliability warnings from the underlying SVG render", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      colors: { ...DEFAULT_DESIGN_CONFIG.colors, foreground: "#f0f0f0", background: "#ffffff" },
    };
    const { warnings } = await renderStyledQrPngDataUrl("https://example.com", design);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("scales the export canvas to the requested resolution (Module 3.4 presets)", async () => {
    for (const size of [512, 1024, 2048]) {
      const drawImage = vi.fn();
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
        drawImage,
      } as unknown as CanvasRenderingContext2D);

      await renderStyledQrPngDataUrl("https://example.com", DEFAULT_DESIGN_CONFIG, size);

      expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, size, size);
    }
  });

  it("includes the logo in the exported PNG's source SVG regardless of resolution", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      logo: { ...DEFAULT_DESIGN_CONFIG.logo, assetUrl: "data:image/png;base64,LOGO" },
    };
    let capturedSvg: string | null = null;
    URL.createObjectURL = vi.fn((blob: Blob) => {
      void blob.text().then((text) => {
        capturedSvg = text;
      });
      return "blob:mock";
    });

    await renderStyledQrPngDataUrl("https://example.com", design, 1024);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(capturedSvg).toContain("data:image/png;base64,LOGO");
  });
});
