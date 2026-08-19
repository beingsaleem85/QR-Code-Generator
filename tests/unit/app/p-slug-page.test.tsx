// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const resolveLandingPage = vi.fn();
const resolvePdfDirectOpenUrl = vi.fn();
const recordQrScan = vi.fn();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const after = vi.fn((callback: () => unknown) => callback());
const headersMock = vi.fn();

vi.mock("@/server/services/landing-page-resolution", () => ({ resolveLandingPage }));
vi.mock("@/server/services/pdf-direct-open", () => ({ resolvePdfDirectOpenUrl }));
vi.mock("@/lib/qr/scan-tracking", () => ({ recordQrScan }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, after };
});
vi.mock("next/headers", () => ({ headers: headersMock }));

// The other landing-page components (and PdfDirectOpenRedirect itself)
// aren't the concern of this test file — stub each to a simple,
// identifiable marker so assertions can check *which* component the page
// chose to render without depending on any of their own internals (several
// make their own Storage/signing calls, and PdfDirectOpenRedirect's own
// meta-refresh/script behavior is covered separately).
vi.mock("@/components/landing/PdfDirectOpenRedirect", () => ({
  PdfDirectOpenRedirect: ({ url }: { url: string }) => `PdfDirectOpenRedirect:${url}`,
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

describe("/p/[slug] — PDF direct-open", () => {
  it("renders the PDF landing page when openDirectly resolves to no URL (off, or missing on an older record)", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf", openDirectly: false },
    });
    resolvePdfDirectOpenUrl.mockResolvedValue(null);
    headersMock.mockResolvedValue(new Headers());
    const { default: LandingPage } = await import("@/app/p/[slug]/page");

    const result = await LandingPage(makeParams("abc12345"));
    render(result);

    expect(screen.getByText("PdfLandingPage")).toBeInTheDocument();
    expect(recordQrScan).not.toHaveBeenCalled();
  });

  it("renders PdfDirectOpenRedirect with the resolved file URL when openDirectly is on", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf", openDirectly: true },
    });
    resolvePdfDirectOpenUrl.mockResolvedValue("https://storage.example/signed?token=abc");
    headersMock.mockResolvedValue(new Headers());
    const { default: LandingPage } = await import("@/app/p/[slug]/page");

    const result = await LandingPage(makeParams("abc12345"));
    render(result);

    expect(
      screen.getByText("PdfDirectOpenRedirect:https://storage.example/signed?token=abc"),
    ).toBeInTheDocument();
  });

  it("records a scan (referrer, user-agent, edge country) on the direct-open path, without delaying the render", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf", openDirectly: true },
    });
    resolvePdfDirectOpenUrl.mockResolvedValue("https://storage.example/signed?token=abc");
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
    expect(recordQrScan).toHaveBeenCalledWith("abc12345", {
      referrer: "https://google.com",
      userAgent: "TestAgent/1.0",
      countryCode: "US",
    });
  });

  it("never resolves a direct-open URL for a paused/archived QR — the inactive check runs first", async () => {
    resolveLandingPage.mockResolvedValue({ status: "inactive" });
    const { default: LandingPage } = await import("@/app/p/[slug]/page");

    const result = await LandingPage(makeParams("abc12345"));
    render(result);

    expect(screen.getByText(/QR code isn.t active/i)).toBeInTheDocument();
    expect(resolvePdfDirectOpenUrl).not.toHaveBeenCalled();
    expect(recordQrScan).not.toHaveBeenCalled();
  });

  it("calls notFound for an unknown slug without ever touching direct-open resolution", async () => {
    resolveLandingPage.mockResolvedValue({ status: "not_found" });
    const { default: LandingPage } = await import("@/app/p/[slug]/page");

    await expect(LandingPage(makeParams("nope"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(resolvePdfDirectOpenUrl).not.toHaveBeenCalled();
  });
});

describe("/p/[slug] — other hosted types are unaffected by the PDF direct-open change", () => {
  it.each([
    ["images", "GalleryLandingPage"],
    ["audio", "AudioLandingPage"],
    ["video", "VideoLandingPage"],
    ["app", "AppLandingPage"],
    ["social", "SocialLandingPage"],
    ["multi_link", "MultiLinkLandingPage"],
    ["menu", "MenuLandingPage"],
  ])(
    "renders the normal %s landing page, never consulting PDF direct-open resolution",
    async (qrType, marker) => {
      resolveLandingPage.mockResolvedValue({ status: "ok", qrType, payloadData: {} });
      const { default: LandingPage } = await import("@/app/p/[slug]/page");

      const result = await LandingPage(makeParams("abc12345"));
      render(result);

      expect(screen.getByText(marker)).toBeInTheDocument();
      expect(resolvePdfDirectOpenUrl).not.toHaveBeenCalled();
    },
  );
});
