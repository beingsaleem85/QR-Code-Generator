// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const recordQrScan = vi.fn();
const after = vi.fn((callback: () => unknown) => callback());
const headersMock = vi.fn();

vi.mock("@/lib/qr/scan-tracking", () => ({ recordQrScan }));
vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, after };
});
vi.mock("next/headers", () => ({ headers: headersMock }));

vi.mock("@/components/landing/pdf-viewer/PdfViewer", () => ({
  PdfViewer: ({ proxyUrl, fileName }: { proxyUrl: string; fileName: string }) =>
    `PdfViewer:${proxyUrl}:${fileName}`,
}));
vi.mock("@/components/landing/PdfLandingPage", () => ({
  PdfLandingPage: () => "PdfLandingPage",
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  headersMock.mockResolvedValue(new Headers());
});

describe("PdfExperience — viewer vs landing page decision", () => {
  it("renders the landing page when openDirectly is off", async () => {
    const { PdfExperience } = await import("@/components/landing/PdfExperience");

    const result = await PdfExperience({
      slug: "abc12345",
      payloadData: { path: "u/a/menu.pdf", openDirectly: false },
      proxyUrl: "/api/public-pdf/abc12345",
    });
    render(result);

    expect(screen.getByText("PdfLandingPage")).toBeInTheDocument();
    expect(recordQrScan).not.toHaveBeenCalled();
  });

  it("renders the landing page for a record predating the field (openDirectly missing)", async () => {
    const { PdfExperience } = await import("@/components/landing/PdfExperience");

    const result = await PdfExperience({
      slug: "abc12345",
      payloadData: { path: "u/a/menu.pdf" },
      proxyUrl: "/api/public-pdf/abc12345",
    });
    render(result);

    expect(screen.getByText("PdfLandingPage")).toBeInTheDocument();
  });

  it("renders the in-app viewer, passed exactly the given proxyUrl, when openDirectly is on", async () => {
    const { PdfExperience } = await import("@/components/landing/PdfExperience");

    const result = await PdfExperience({
      slug: "abc12345",
      payloadData: { path: "u/a/menu.pdf", fileName: "menu.pdf", openDirectly: true },
      proxyUrl: "/api/pdf-view/aBcDeFgHiJkLmNoP",
    });
    render(result);

    expect(
      screen.getByText("PdfViewer:/api/pdf-view/aBcDeFgHiJkLmNoP:menu.pdf"),
    ).toBeInTheDocument();
  });

  it("falls back to the landing page when openDirectly is on but no file has been uploaded yet", async () => {
    const { PdfExperience } = await import("@/components/landing/PdfExperience");

    const result = await PdfExperience({
      slug: "abc12345",
      payloadData: { openDirectly: true },
      proxyUrl: "/api/public-pdf/abc12345",
    });
    render(result);

    expect(screen.getByText("PdfLandingPage")).toBeInTheDocument();
  });
});

describe("PdfExperience — analytics", () => {
  it("records exactly one scan (referrer, user-agent, edge country), keyed by slug, for the direct-open path", async () => {
    headersMock.mockResolvedValue(
      new Headers({
        referer: "https://google.com",
        "user-agent": "TestAgent/1.0",
        "x-vercel-ip-country": "US",
      }),
    );
    const { PdfExperience } = await import("@/components/landing/PdfExperience");

    await PdfExperience({
      slug: "abc12345",
      payloadData: { path: "u/a/menu.pdf", openDirectly: true },
      proxyUrl: "/api/pdf-view/aBcDeFgHiJkLmNoP",
    });

    expect(after).toHaveBeenCalledOnce();
    expect(recordQrScan).toHaveBeenCalledOnce();
    expect(recordQrScan).toHaveBeenCalledWith("abc12345", {
      referrer: "https://google.com",
      userAgent: "TestAgent/1.0",
      countryCode: "US",
    });
  });

  it("never records a scan for the landing-page path", async () => {
    const { PdfExperience } = await import("@/components/landing/PdfExperience");

    await PdfExperience({
      slug: "abc12345",
      payloadData: { path: "u/a/menu.pdf", openDirectly: false },
      proxyUrl: "/api/public-pdf/abc12345",
    });

    expect(recordQrScan).not.toHaveBeenCalled();
  });
});
