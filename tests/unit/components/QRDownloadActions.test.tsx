// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QRDownloadActions } from "@/components/qr/QRDownloadActions";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

afterEach(() => cleanup());

// jsdom doesn't implement object URLs, real image loading, or a canvas 2D
// context — the PNG path (Module 3.3) converts the styled SVG via
// Image+canvas, so all three are mocked here.
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

describe("QRDownloadActions", () => {
  it("disables both download buttons when content is invalid/empty", () => {
    render(
      <QRDownloadActions qrType="url" content={{}} design={DEFAULT_DESIGN_CONFIG} name="My QR" />,
    );

    expect(screen.getByRole("button", { name: "Download PNG" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Download SVG" })).toBeDisabled();
  });

  it("enables both download buttons once content is valid", () => {
    render(
      <QRDownloadActions
        qrType="url"
        content={{ url: "example.com" }}
        design={DEFAULT_DESIGN_CONFIG}
        name="My QR"
      />,
    );

    expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Download SVG" })).toBeEnabled();
  });

  it("triggers a PNG download with a sanitized filename when clicked", async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const createElementSpy = vi.spyOn(document, "createElement");

    const user = userEvent.setup();
    render(
      <QRDownloadActions
        qrType="url"
        content={{ url: "example.com" }}
        design={DEFAULT_DESIGN_CONFIG}
        name="My Restaurant Menu"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Download PNG" }));
    expect(await screen.findByRole("button", { name: "Download PNG" })).toBeEnabled();

    const anchor = createElementSpy.mock.results
      .map((result) => result.value)
      .find((value): value is HTMLAnchorElement => value instanceof HTMLAnchorElement);

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(anchor?.download).toBe("my-restaurant-menu-qr.png");
    expect(anchor?.href).toMatch(/^data:image\/png;base64,/);

    clickSpy.mockRestore();
    createElementSpy.mockRestore();
  });

  it("triggers an SVG download with a sanitized filename when clicked", async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const createElementSpy = vi.spyOn(document, "createElement");

    const user = userEvent.setup();
    render(
      <QRDownloadActions
        qrType="url"
        content={{ url: "example.com" }}
        design={DEFAULT_DESIGN_CONFIG}
        name="My Restaurant Menu"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Download SVG" }));
    expect(await screen.findByRole("button", { name: "Download SVG" })).toBeEnabled();

    const anchor = createElementSpy.mock.results
      .map((result) => result.value)
      .find((value): value is HTMLAnchorElement => value instanceof HTMLAnchorElement);

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(anchor?.download).toBe("my-restaurant-menu-qr.svg");

    clickSpy.mockRestore();
    createElementSpy.mockRestore();
  });

  it("defaults the PNG size selector to 1024px", () => {
    render(
      <QRDownloadActions
        qrType="url"
        content={{ url: "example.com" }}
        design={DEFAULT_DESIGN_CONFIG}
        name="My QR"
      />,
    );

    expect(screen.getByLabelText("PNG size")).toHaveValue("1024");
  });

  it("renders the selected PNG size onto the export canvas", async () => {
    const createElementSpy = vi.spyOn(document, "createElement");
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const user = userEvent.setup();
    render(
      <QRDownloadActions
        qrType="url"
        content={{ url: "example.com" }}
        design={DEFAULT_DESIGN_CONFIG}
        name="My QR"
      />,
    );

    await user.selectOptions(screen.getByLabelText("PNG size"), "2048");
    await user.click(screen.getByRole("button", { name: "Download PNG" }));
    expect(await screen.findByRole("button", { name: "Download PNG" })).toBeEnabled();

    const canvas = createElementSpy.mock.results
      .map((result) => result.value)
      .find((value): value is HTMLCanvasElement => value instanceof HTMLCanvasElement);

    expect(canvas?.width).toBe(2048);

    createElementSpy.mockRestore();
  });
});
