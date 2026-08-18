// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QRPreviewPanel } from "@/components/qr/QRPreviewPanel";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

afterEach(() => cleanup());

describe("QRPreviewPanel", () => {
  it("shows the enter-content placeholder when content is empty", () => {
    render(
      <QRPreviewPanel qrType="url" mode="static" content={{}} design={DEFAULT_DESIGN_CONFIG} />,
    );

    expect(screen.getByText("Enter content to preview your QR code.")).toBeInTheDocument();
  });

  it("renders a real QR code once content is valid", async () => {
    render(
      <QRPreviewPanel
        qrType="url"
        mode="static"
        content={{ url: "example.com" }}
        design={DEFAULT_DESIGN_CONFIG}
      />,
    );

    const preview = await screen.findByRole("img", { name: "QR code preview" });
    expect(preview.querySelector("svg")).toBeInTheDocument();
  });

  it("falls back to the placeholder again once content becomes invalid", async () => {
    const { rerender } = render(
      <QRPreviewPanel
        qrType="url"
        mode="static"
        content={{ url: "example.com" }}
        design={DEFAULT_DESIGN_CONFIG}
      />,
    );
    await screen.findByRole("img", { name: "QR code preview" });

    rerender(
      <QRPreviewPanel
        qrType="url"
        mode="static"
        content={{ url: "" }}
        design={DEFAULT_DESIGN_CONFIG}
      />,
    );

    expect(screen.getByText("Enter content to preview your QR code.")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "QR code preview" })).not.toBeInTheDocument();
  });
});
