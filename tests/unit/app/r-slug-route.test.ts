import { afterEach, describe, expect, it, vi } from "vitest";

const resolveDynamicQrRedirect = vi.fn();
const recordQrScan = vi.fn();
const after = vi.fn((callback: () => unknown) => callback());

vi.mock("@/server/services/redirect-resolution", () => ({ resolveDynamicQrRedirect }));
vi.mock("@/lib/qr/scan-tracking", () => ({ recordQrScan }));
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

describe("GET /r/[slug]", () => {
  it("redirects to the destination on a resolved, active dynamic QR", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({
      status: "ok",
      destinationUrl: "https://example.com/landing",
    });
    const { GET } = await import("@/app/r/[slug]/route");

    const response = await GET(
      new Request("https://app.example/r/abc12345"),
      makeContext("abc12345"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/landing");
  });

  it("returns 404 for an unknown slug", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({ status: "not_found" });
    const { GET } = await import("@/app/r/[slug]/route");

    const response = await GET(new Request("https://app.example/r/nope"), makeContext("nope"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
  });

  it("returns 410 for a paused/archived dynamic QR", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({ status: "inactive" });
    const { GET } = await import("@/app/r/[slug]/route");

    const response = await GET(
      new Request("https://app.example/r/abc12345"),
      makeContext("abc12345"),
    );

    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ error: "inactive" });
  });

  it("records a scan (with the referrer header) without delaying the redirect", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({
      status: "ok",
      destinationUrl: "https://example.com",
    });
    const { GET } = await import("@/app/r/[slug]/route");

    await GET(
      new Request("https://app.example/r/abc12345", {
        headers: { referer: "https://google.com" },
      }),
      makeContext("abc12345"),
    );

    expect(after).toHaveBeenCalledOnce();
    expect(recordQrScan).toHaveBeenCalledWith("abc12345", "https://google.com");
  });

  it("never records a scan for a not_found or inactive resolution", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({ status: "not_found" });
    const { GET } = await import("@/app/r/[slug]/route");

    await GET(new Request("https://app.example/r/nope"), makeContext("nope"));

    expect(recordQrScan).not.toHaveBeenCalled();
  });
});
