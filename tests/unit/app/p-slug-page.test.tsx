// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const resolveLandingPage = vi.fn();
const recordQrScan = vi.fn();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const after = vi.fn((callback: () => unknown) => callback());
const headersMock = vi.fn();

vi.mock("@/server/services/landing-page-resolution", () => ({ resolveLandingPage }));
vi.mock("@/lib/qr/scan-tracking", () => ({ recordQrScan }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, after };
});
vi.mock("next/headers", () => ({ headers: headersMock }));

// Stub every landing-page/viewer component to a simple, identifiable
// marker so assertions can check *which* component the page chose to
// render without depending on its own internals (several make their own
// Storage/signing calls, and PdfViewer's own pdf.js behavior is covered
// separately in tests/unit/components/PdfViewer.test.tsx).
vi.mock("@/components/landing/pdf-viewer/PdfViewer", () => ({
  PdfViewer: ({ slug, fileName }: { slug: string; fileName: string }) =>
    `PdfViewer:${slug}:${fileName}`,
}));
vi.mock("@/components/landing/PdfLandingPage", () => ({
  PdfLandingPage: () => "PdfLandingPage",
}));
vi.mock("@/components/landing/GalleryLandingPage", () => ({
  GalleryLandingPage: () => "GalleryLandingPage",
}));
vi.mock("@/components/landing/AudioLandingPage", () => ({
  AudioLandingPage: () => "AudioLandingPage",
}));
vi.mock("@/components/landing/VideoLandingPage", () => ({
  VideoLandingPage: () => "VideoLandingPage",
}));
vi.mock("@/components/landing/AppLandingPage", () => ({ AppLandingPage: () => "AppLandingPage" }));
vi.mock("@/components/landing/SocialLandingPage", () => ({
  SocialLandingPage: () => "SocialLandingPage",
}));
vi.mock("@/components/landing/MultiLinkLandingPage", () => ({
  MultiLinkLandingPage: () => "MultiLinkLandingPage",
}));
vi.mock("@/components/landing/MenuLandingPage", () => ({
  MenuLandingPage: () => "MenuLandingPage",
}));
vi.mock("@/components/landing/FeedbackLandingPage", () => ({
  FeedbackLandingPage: () => "FeedbackLandingPage",
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  headersMock.mockResolvedValue(new Headers());
});

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("/p/[slug] — PDF direct-open viewer routing", () => {
  it("renders the PDF landing page when openDirectly is off", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf", fileName: "menu.pdf", openDirectly: false },
    });
    const { default: LandingPage } = await import("@/app/p/[slug]/page");

    const result = await LandingPage(makeParams("abc12345"));
    render(result);

    expect(screen.getByText("PdfLandingPage")).toBeInTheDocument();
    expect(recordQrScan).not.toHaveBeenCalled();
  });

  it("renders the PdfLandingPage for a record predating the field (openDirectly missing)", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf", fileName: "menu.pdf" },
    });
    const { default: LandingPage } = await import("@/app/p/[slug]/page");

    const result = await LandingPage(makeParams("abc12345"));
    render(result);

    expect(screen.getByText("PdfLandingPage")).toBeInTheDocument();
  });

  it("renders the in-app PdfViewer (never an external URL) when openDirectly is on", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf", fileName: "menu.pdf", openDirectly: true },
    });
    const { default: LandingPage } = await import("@/app/p/[slug]/page");

    const result = await LandingPage(makeParams("abc12345"));
    render(result);

    expect(screen.getByText("PdfViewer:abc12345:menu.pdf")).toBeInTheDocument();
  });

  it("falls back to the landing page when openDirectly is on but no file has been uploaded yet", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { openDirectly: true },
    });
    const { default: LandingPage } = await import("@/app/p/[slug]/page");

    const result = await LandingPage(makeParams("abc12345"));
    render(result);

    expect(screen.getByText("PdfLandingPage")).toBeInTheDocument();
  });

  it("records a scan (referrer, user-agent, edge country) once for the direct-open path", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf", fileName: "menu.pdf", openDirectly: true },
    });
    headersMock.mockResolvedValue(
      new Headers({
        referer: "https://google.com",
        "user-agent": "TestAgent/1.0",
        "x-vercel-ip-country": "US",
      }),
    );
    const { default: LandingPage } = await import("@/app/p/[slug]/page");

    await LandingPage(makeParams("abc12345"));

    expect(after).toHaveBeenCalledOnce();
    expect(recordQrScan).toHaveBeenCalledOnce();
    expect(recordQrScan).toHaveBeenCalledWith("abc12345", {
      referrer: "https://google.com",
      userAgent: "TestAgent/1.0",
      countryCode: "US",
    });
  });

  it("never renders the viewer or records a scan for a paused/archived QR — the inactive check runs first", async () => {
    resolveLandingPage.mockResolvedValue({ status: "inactive" });
    const { default: LandingPage } = await import("@/app/p/[slug]/page");

    const result = await LandingPage(makeParams("abc12345"));
    render(result);

    expect(screen.getByText(/QR code isn.t active/i)).toBeInTheDocument();
    expect(screen.queryByText(/PdfViewer:/)).not.toBeInTheDocument();
    expect(recordQrScan).not.toHaveBeenCalled();
  });

  it("calls notFound for an unknown slug", async () => {
    resolveLandingPage.mockResolvedValue({ status: "not_found" });
    const { default: LandingPage } = await import("@/app/p/[slug]/page");

    await expect(LandingPage(makeParams("nope"))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("/p/[slug] — other hosted types are unaffected by the PDF viewer change", () => {
  it.each([
    ["images", "GalleryLandingPage"],
    ["audio", "AudioLandingPage"],
    ["video", "VideoLandingPage"],
    ["app", "AppLandingPage"],
    ["social", "SocialLandingPage"],
    ["multi_link", "MultiLinkLandingPage"],
    ["menu", "MenuLandingPage"],
  ])("renders the normal %s landing page unaffected", async (qrType, marker) => {
    resolveLandingPage.mockResolvedValue({ status: "ok", qrType, payloadData: {} });
    const { default: LandingPage } = await import("@/app/p/[slug]/page");

    const result = await LandingPage(makeParams("abc12345"));
    render(result);

    expect(screen.getByText(marker)).toBeInTheDocument();
  });
});
