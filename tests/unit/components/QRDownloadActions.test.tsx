// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QRDownloadActions } from "@/components/qr/QRDownloadActions";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

afterEach(() => cleanup());

// jsdom doesn't implement these — only needed so the SVG download path
// (URL.createObjectURL/revokeObjectURL) doesn't throw during the test.
beforeEach(() => {
  if (!URL.createObjectURL) URL.createObjectURL = vi.fn(() => "blob:mock");
  if (!URL.revokeObjectURL) URL.revokeObjectURL = vi.fn();
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

  it("keeps Save QR disabled — real persistence arrives in Module 3.5", () => {
    render(
      <QRDownloadActions
        qrType="url"
        content={{ url: "example.com" }}
        design={DEFAULT_DESIGN_CONFIG}
        name="My QR"
      />,
    );

    expect(screen.getByRole("button", { name: "Save QR" })).toBeDisabled();
  });
});
