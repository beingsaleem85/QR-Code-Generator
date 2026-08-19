// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const resolvePublicToken = vi.fn();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/server/services/public-token-resolution", () => ({ resolvePublicToken }));
vi.mock("next/navigation", () => ({ notFound }));

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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function makeParams(token: string) {
  return { params: Promise.resolve({ token }) };
}

describe("/v/[token] — opaque public viewer entry point", () => {
  it("delegates to PdfExperience with the internal slug, payload, and the token-based proxy URL — never the slug in the URL", async () => {
    resolvePublicToken.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf", fileName: "menu.pdf", openDirectly: true },
      slug: "abc12345",
    });
    const { default: PublicViewerPage } = await import("@/app/v/[token]/page");

    const result = await PublicViewerPage(makeParams("aBcDeFgHiJkLmNoP"));
    render(result);

    expect(
      screen.getByText(
        'PdfExperience:abc12345:/api/pdf-view/aBcDeFgHiJkLmNoP:{"path":"u/a/menu.pdf","fileName":"menu.pdf","openDirectly":true}',
      ),
    ).toBeInTheDocument();
  });

  it("shows the inactive card for a paused/archived QR — file access is blocked upstream of the viewer", async () => {
    resolvePublicToken.mockResolvedValue({ status: "inactive" });
    const { default: PublicViewerPage } = await import("@/app/v/[token]/page");

    const result = await PublicViewerPage(makeParams("aBcDeFgHiJkLmNoP"));
    render(result);

    expect(screen.getByText(/QR code isn.t active/i)).toBeInTheDocument();
    expect(screen.queryByText(/PdfExperience:/)).not.toBeInTheDocument();
  });

  it("calls notFound for an unknown token", async () => {
    resolvePublicToken.mockResolvedValue({ status: "not_found" });
    const { default: PublicViewerPage } = await import("@/app/v/[token]/page");

    await expect(PublicViewerPage(makeParams("nope"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("calls notFound for a token resolving to a non-PDF QR type — /v/ only ever serves PDFs", async () => {
    resolvePublicToken.mockResolvedValue({
      status: "ok",
      qrType: "images",
      payloadData: {},
      slug: "abc12345",
    });
    const { default: PublicViewerPage } = await import("@/app/v/[token]/page");

    await expect(PublicViewerPage(makeParams("aBcDeFgHiJkLmNoP"))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
