// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const resolveLandingPage = vi.fn();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/server/services/landing-page-resolution", () => ({ resolveLandingPage }));
vi.mock("next/navigation", () => ({ notFound }));

// Stub every landing-page/experience component to a simple, identifiable
// marker so assertions can check *which* component the page chose to
// render, and with which props, without depending on its own internals.
// `PdfExperience`'s own viewer-vs-landing-page decision and scan recording
// are covered separately in tests/unit/components/PdfExperience.test.tsx —
// this file only verifies /p/[slug] resolves and delegates correctly.
vi.mock("@/components/landing/PdfExperience", () => ({
  PdfExperience: ({
    slug,
    payloadData,
    proxyUrl,
  }: {
    slug: string;
    payloadData: Record<string, unknown>;
    proxyUrl: string;
  }) => `PdfExperience:${slug}:${proxyUrl}:${JSON.stringify(payloadData)}`,
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
});

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("/p/[slug] — PDF resolution and delegation", () => {
  it("delegates to PdfExperience with the slug, payload, and the slug-based proxy URL", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf", fileName: "menu.pdf", openDirectly: true },
    });
    const { default: LandingPage } = await import("@/app/p/[slug]/page");

    const result = await LandingPage(makeParams("abc12345"));
    render(result);

    expect(
      screen.getByText(
        'PdfExperience:abc12345:/api/public-pdf/abc12345:{"path":"u/a/menu.pdf","fileName":"menu.pdf","openDirectly":true}',
      ),
    ).toBeInTheDocument();
  });

  it("never renders anything for a paused/archived QR — the inactive check runs first", async () => {
    resolveLandingPage.mockResolvedValue({ status: "inactive" });
    const { default: LandingPage } = await import("@/app/p/[slug]/page");

    const result = await LandingPage(makeParams("abc12345"));
    render(result);

    expect(screen.getByText(/QR code isn.t active/i)).toBeInTheDocument();
    expect(screen.queryByText(/PdfExperience:/)).not.toBeInTheDocument();
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
