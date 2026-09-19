// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  it("shows a reliability warning inline when contrast is too low", async () => {
    const design = {
      ...DEFAULT_DESIGN_CONFIG,
      colors: { ...DEFAULT_DESIGN_CONFIG.colors, foreground: "#f0f0f0", background: "#ffffff" },
    };

    render(
      <QRPreviewPanel
        qrType="url"
        mode="static"
        content={{ url: "example.com" }}
        design={design}
      />,
    );

    await screen.findByRole("img", { name: "QR code preview" });
    expect(await screen.findByText(/contrast/i)).toBeInTheDocument();
    expect(screen.queryByText("Scan to test.")).not.toBeInTheDocument();
  });

  it("shows the plain scan-to-test note when there are no warnings", async () => {
    render(
      <QRPreviewPanel
        qrType="url"
        mode="static"
        content={{ url: "example.com" }}
        design={DEFAULT_DESIGN_CONFIG}
      />,
    );

    expect(await screen.findByText("Scan to test.")).toBeInTheDocument();
  });

  it("shows a distinct pending-save message for a dynamic QR with valid content but no slug yet", () => {
    render(
      <QRPreviewPanel
        qrType="url"
        mode="dynamic"
        content={{ url: "example.com" }}
        design={DEFAULT_DESIGN_CONFIG}
      />,
    );

    expect(
      screen.getByText("Save to generate your scannable dynamic QR code."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "QR code preview" })).not.toBeInTheDocument();
  });

  it("renders the real /r/[slug] redirect QR for a dynamic QR that already has a slug", async () => {
    render(
      <QRPreviewPanel
        qrType="url"
        mode="dynamic"
        content={{ url: "example.com" }}
        design={DEFAULT_DESIGN_CONFIG}
        slug="abc12345"
      />,
    );

    const preview = await screen.findByRole("img", { name: "QR code preview" });
    expect(preview.querySelector("svg")).toBeInTheDocument();
  });

  describe("Destination Preview Tab", () => {
    it("switches to destination preview and shows empty message when no PDF uploaded", () => {
      render(
        <QRPreviewPanel
          qrType="pdf"
          mode="dynamic"
          content={{}}
          design={DEFAULT_DESIGN_CONFIG}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Destination preview" }));
      expect(screen.getByText("No PDF uploaded yet")).toBeInTheDocument();
    });

    it("renders direct PDF viewer and fallback link when openDirectly is true", () => {
      render(
        <QRPreviewPanel
          qrType="pdf"
          mode="dynamic"
          content={{
            blobUrl: "blob:http://localhost/test-uuid",
            fileName: "menu.pdf",
            openDirectly: true,
          }}
          design={DEFAULT_DESIGN_CONFIG}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Destination preview" }));
      expect(screen.getByText("Direct PDF Document")).toBeInTheDocument();
      expect(screen.getByText("Local preview")).toBeInTheDocument();
      const iframe = screen.getByTitle("Preview of menu.pdf");
      expect(iframe).toHaveAttribute("src", "blob:http://localhost/test-uuid");
      expect(screen.getByRole("link", { name: "Open PDF in new tab" })).toHaveAttribute(
        "href",
        "blob:http://localhost/test-uuid",
      );
    });

    it("renders hosted landing page mockup when openDirectly is false", () => {
      render(
        <QRPreviewPanel
          qrType="pdf"
          mode="dynamic"
          content={{
            blobUrl: "blob:http://localhost/test-uuid",
            fileName: "annual-report.pdf",
            openDirectly: false,
          }}
          design={DEFAULT_DESIGN_CONFIG}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Destination preview" }));
      expect(screen.getByText("PDF Landing Page")).toBeInTheDocument();
      expect(screen.getByTitle("Landing page preview of annual-report.pdf")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Download PDF" })).toHaveAttribute(
        "href",
        "blob:http://localhost/test-uuid",
      );
    });

    it("shows website redirect summary with parsed host for URL type", () => {
      render(
        <QRPreviewPanel
          qrType="url"
          mode="static"
          content={{ url: "https://example.com/some/path" }}
          design={DEFAULT_DESIGN_CONFIG}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Destination preview" }));
      expect(screen.getByText("Website Redirect")).toBeInTheDocument();
      expect(screen.getByText("example.com")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Visit website" })).toHaveAttribute(
        "href",
        "https://example.com/some/path",
      );
    });
  });

  describe("Authorization Matrix & Zero-Render Security", () => {
    it("does NOT invoke QR encoder and does NOT render QR SVG/canvas for guest", async () => {
      const onGuestAction = vi.fn();
      const renderSpy = vi.spyOn(await import("@/lib/qr/styled-svg"), "renderStyledQrSvg");
      renderSpy.mockClear();

      const { container } = render(
        <QRPreviewPanel
          qrType="url"
          mode="static"
          content={{ url: "https://example-secret.com" }}
          design={DEFAULT_DESIGN_CONFIG}
          isAuthenticated={false}
          onGuestAction={onGuestAction}
        />,
      );

      // Wait a tick to ensure debounce timeout would have fired if active
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(renderSpy).not.toHaveBeenCalled();
      expect(screen.queryByRole("img", { name: "QR code preview" })).not.toBeInTheDocument();
      expect(container.querySelector("canvas")).not.toBeInTheDocument();

      expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
      expect(
        screen.getByText("Create a free account or sign in to generate, download, and manage your QR codes."),
      ).toBeInTheDocument();
      expect(screen.getByText("Sign in to generate scannable QR code.")).toBeInTheDocument();

      const generateBtn = screen.getByRole("button", { name: "Generate QR" });
      expect(generateBtn).toBeInTheDocument();
      fireEvent.click(generateBtn);
      expect(onGuestAction).toHaveBeenCalledTimes(1);

      renderSpy.mockRestore();
    });

    it("does NOT invoke QR encoder and does NOT render QR SVG/canvas for expired free trial", async () => {
      const onTrialExpired = vi.fn();
      const renderSpy = vi.spyOn(await import("@/lib/qr/styled-svg"), "renderStyledQrSvg");
      renderSpy.mockClear();

      const { container } = render(
        <QRPreviewPanel
          qrType="url"
          mode="static"
          content={{ url: "https://example-secret.com" }}
          design={DEFAULT_DESIGN_CONFIG}
          isAuthenticated={true}
          isTrialExpired={true}
          onTrialExpired={onTrialExpired}
        />,
      );

      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(renderSpy).not.toHaveBeenCalled();
      expect(screen.queryByRole("img", { name: "QR code preview" })).not.toBeInTheDocument();
      expect(container.querySelector("canvas")).not.toBeInTheDocument();

      expect(screen.getByText("Free Trial Expired")).toBeInTheDocument();
      expect(
        screen.getByText("Your 14-day free trial has ended. Upgrade to Pro to generate, download, and manage your QR codes."),
      ).toBeInTheDocument();
      expect(screen.getByText("Upgrade to Pro to generate scannable QR code.")).toBeInTheDocument();

      const upgradeBtn = screen.getByRole("button", { name: "Upgrade to Pro" });
      expect(upgradeBtn).toBeInTheDocument();
      fireEvent.click(upgradeBtn);
      expect(onTrialExpired).toHaveBeenCalledTimes(1);

      renderSpy.mockRestore();
    });

    it("DOES invoke QR encoder and renders real QR SVG for authorized active free trial / pro user", async () => {
      const renderSpy = vi.spyOn(await import("@/lib/qr/styled-svg"), "renderStyledQrSvg");
      renderSpy.mockClear();

      render(
        <QRPreviewPanel
          qrType="url"
          mode="static"
          content={{ url: "https://example.com" }}
          design={DEFAULT_DESIGN_CONFIG}
          isAuthenticated={true}
          isTrialExpired={false}
        />,
      );

      const preview = await screen.findByRole("img", { name: "QR code preview" });
      expect(preview.querySelector("svg")).toBeInTheDocument();
      expect(renderSpy).toHaveBeenCalledWith("https://example.com", expect.anything(), "url");

      renderSpy.mockRestore();
    });
  });
});
