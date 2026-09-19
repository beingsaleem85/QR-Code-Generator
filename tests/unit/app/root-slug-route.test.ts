import { afterEach, describe, expect, it, vi } from "vitest";

const resolveDynamicQrRedirect = vi.fn();
const resolveLandingPage = vi.fn();
const recordQrScan = vi.fn();
const after = vi.fn((callback: () => unknown) => callback());

vi.mock("@/server/services/redirect-resolution", () => ({ resolveDynamicQrRedirect }));
vi.mock("@/server/services/landing-page-resolution", () => ({ resolveLandingPage }));
vi.mock("@/lib/qr/scan-tracking", () => ({ recordQrScan }));
vi.mock("@/lib/rate-limit", () => ({
  readClientIp: (headers: Headers) => headers.get("x-forwarded-for") ?? headers.get("x-real-ip"),
}));
vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, after };
});

afterEach(() => {
  vi.clearAllMocks();
});

function makeContext(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("GET /:slug (Root-level short URL)", () => {
  it("redirects to the destination for an active dynamic QR", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({
      status: "ok",
      destinationUrl: "https://mywebsite.com/profile",
    });
    const { GET } = await import("@/app/[slug]/route");

    const response = await GET(
      new Request("https://qrforge.space/abdias"),
      makeContext("abdias"),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://mywebsite.com/profile");
    expect(recordQrScan).toHaveBeenCalledWith("abdias", expect.any(Object));
  });

  it("safely blocks reserved application paths from being intercepted as short links", async () => {
    const { GET } = await import("@/app/[slug]/route");

    for (const reserved of ["pricing", "login", "dashboard", "api", "terms", "privacy"]) {
      const response = await GET(
        new Request(`https://qrforge.space/${reserved}`),
        makeContext(reserved),
      );
      expect(response.status).toBe(404);
      expect(resolveDynamicQrRedirect).not.toHaveBeenCalled();
    }
  });

  it("internally rewrites to /p/[slug] when the QR is a hosted landing-page type (e.g. PDF) preserving address bar", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({ status: "not_found" });
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "user/asset/file.pdf" },
    });
    const { GET } = await import("@/app/[slug]/route");

    const response = await GET(
      new Request("https://qrforge.space/menu-pdf?src=scan"),
      makeContext("menu-pdf"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toContain("/p/menu-pdf?src=scan");
  });

  it("returns 410 for an inactive/paused QR code", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({ status: "inactive" });
    const { GET } = await import("@/app/[slug]/route");

    const response = await GET(
      new Request("https://qrforge.space/paused-link"),
      makeContext("paused-link"),
    );

    expect(response.status).toBe(410);
    const body = await response.text();
    expect(body).toContain("This QR code is currently inactive");
    expect(body).toContain("The QR code owner needs to reactivate their QRForge account.");
  });

  it("returns 404 for an unknown slug", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({ status: "not_found" });
    resolveLandingPage.mockResolvedValue({ status: "not_found" });
    const { GET } = await import("@/app/[slug]/route");

    const response = await GET(
      new Request("https://qrforge.space/unknown-slug"),
      makeContext("unknown-slug"),
    );

    expect(response.status).toBe(404);
    const body = await response.text();
    expect(body).toContain("Link not found");
  });

  it("returns 429 when rate limited", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({ status: "rate_limited" });
    const { GET } = await import("@/app/[slug]/route");

    const response = await GET(
      new Request("https://qrforge.space/flood-link"),
      makeContext("flood-link"),
    );

    expect(response.status).toBe(429);
    const body = await response.text();
    expect(body).toContain("Too many requests");
  });
});
