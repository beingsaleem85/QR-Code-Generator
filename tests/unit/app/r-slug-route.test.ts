import { afterEach, describe, expect, it, vi } from "vitest";

const resolveDynamicQrRedirect = vi.fn();
const recordQrScan = vi.fn();
const after = vi.fn((callback: () => unknown) => callback());
const checkRateLimit = vi.fn<(key: string, config: unknown) => Promise<boolean>>(() =>
  Promise.resolve(true),
);

vi.mock("@/server/services/redirect-resolution", () => ({ resolveDynamicQrRedirect }));
vi.mock("@/lib/qr/scan-tracking", () => ({ recordQrScan }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (key: string, config: unknown) => checkRateLimit(key, config),
  readClientIp: (headers: Headers) => headers.get("x-forwarded-for") ?? headers.get("x-real-ip"),
}));
vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, after };
});

afterEach(() => {
  vi.clearAllMocks();
  checkRateLimit.mockResolvedValue(true);
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

  it("returns 404 with a controlled HTML unavailable page for an unknown slug, not a redirect", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({ status: "not_found" });
    const { GET } = await import("@/app/r/[slug]/route");

    const response = await GET(new Request("https://app.example/r/nope"), makeContext("nope"));

    expect(response.status).toBe(404);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("content-type")).toMatch(/text\/html/);
    const body = await response.text();
    expect(body).toContain("Link not found");
  });

  it("returns 410 with a controlled HTML unavailable page for a paused/archived dynamic QR, not a redirect", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({ status: "inactive" });
    const { GET } = await import("@/app/r/[slug]/route");

    const response = await GET(
      new Request("https://app.example/r/abc12345"),
      makeContext("abc12345"),
    );

    expect(response.status).toBe(410);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("content-type")).toMatch(/text\/html/);
    const body = await response.text();
    expect(body).toContain("Link not active");
  });

  it("records a scan (referrer, user-agent, edge country header) without delaying the redirect", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({
      status: "ok",
      destinationUrl: "https://example.com",
    });
    const { GET } = await import("@/app/r/[slug]/route");

    await GET(
      new Request("https://app.example/r/abc12345", {
        headers: {
          referer: "https://google.com",
          "user-agent": "TestAgent/1.0",
          "x-vercel-ip-country": "US",
        },
      }),
      makeContext("abc12345"),
    );

    expect(after).toHaveBeenCalledOnce();
    expect(recordQrScan).toHaveBeenCalledWith("abc12345", {
      referrer: "https://google.com",
      userAgent: "TestAgent/1.0",
      countryCode: "US",
    });
  });

  it("falls back to Cloudflare's country header when Vercel's isn't present", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({
      status: "ok",
      destinationUrl: "https://example.com",
    });
    const { GET } = await import("@/app/r/[slug]/route");

    await GET(
      new Request("https://app.example/r/abc12345", { headers: { "cf-ipcountry": "DE" } }),
      makeContext("abc12345"),
    );

    expect(recordQrScan).toHaveBeenCalledWith(
      "abc12345",
      expect.objectContaining({ countryCode: "DE" }),
    );
  });

  it("passes a null country code when neither edge header is present", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({
      status: "ok",
      destinationUrl: "https://example.com",
    });
    const { GET } = await import("@/app/r/[slug]/route");

    await GET(new Request("https://app.example/r/abc12345"), makeContext("abc12345"));

    expect(recordQrScan).toHaveBeenCalledWith(
      "abc12345",
      expect.objectContaining({ countryCode: null }),
    );
  });

  it("never records a scan for a not_found or inactive resolution", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({ status: "not_found" });
    const { GET } = await import("@/app/r/[slug]/route");

    await GET(new Request("https://app.example/r/nope"), makeContext("nope"));

    expect(recordQrScan).not.toHaveBeenCalled();
  });

  it("returns 429 with a controlled HTML page when the per-IP rate limit is exceeded, never resolving the slug", async () => {
    checkRateLimit.mockResolvedValue(false);
    const { GET } = await import("@/app/r/[slug]/route");

    const response = await GET(
      new Request("https://app.example/r/abc12345", {
        headers: { "x-forwarded-for": "203.0.113.5" },
      }),
      makeContext("abc12345"),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("content-type")).toMatch(/text\/html/);
    expect(await response.text()).toContain("Too many requests");
    expect(resolveDynamicQrRedirect).not.toHaveBeenCalled();
  });

  it("checks the rate limit keyed by client IP when one is present", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({
      status: "ok",
      destinationUrl: "https://example.com",
    });
    const { GET } = await import("@/app/r/[slug]/route");

    await GET(
      new Request("https://app.example/r/abc12345", {
        headers: { "x-forwarded-for": "203.0.113.5" },
      }),
      makeContext("abc12345"),
    );

    expect(checkRateLimit).toHaveBeenCalledWith(
      "redirect:203.0.113.5",
      expect.objectContaining({ maxPerWindow: expect.any(Number) }),
    );
  });

  it("skips the rate-limit check entirely when no client IP header is present", async () => {
    resolveDynamicQrRedirect.mockResolvedValue({
      status: "ok",
      destinationUrl: "https://example.com",
    });
    const { GET } = await import("@/app/r/[slug]/route");

    await GET(new Request("https://app.example/r/abc12345"), makeContext("abc12345"));

    expect(checkRateLimit).not.toHaveBeenCalled();
  });
});
