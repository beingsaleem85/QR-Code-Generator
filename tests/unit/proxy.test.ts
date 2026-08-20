import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: { getUser } })),
}));

// A real HTTP request always carries a `Host` header, but constructing a
// bare `NextRequest` from just a URL string doesn't synthesize one — set it
// explicitly so `request.headers.get("host")` behaves the way it does for
// actual production traffic.
function makeRequest(url: string) {
  return new NextRequest(url, { headers: { host: new URL(url).host } });
}

describe("proxy — canonical host redirect", () => {
  it("redirects the old Vercel production hostname to qrforge.space, preserving path and query", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://qr-code-generator-ebon-seven.vercel.app/p/ABC123?x=1");

    const response = await proxy(request);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://qrforge.space/p/ABC123?x=1");
    expect(getUser).not.toHaveBeenCalled();
  });

  it("redirects www.qrforge.space to the apex domain, preserving path and query", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://www.qrforge.space/dashboard?tab=analytics");

    const response = await proxy(request);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://qrforge.space/dashboard?tab=analytics");
  });

  it("never redirects the canonical apex domain itself — no redirect loop", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://qrforge.space/qr-generator");

    const response = await proxy(request);

    expect(response.status).not.toBe(308);
  });

  it("never redirects localhost development traffic", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { proxy } = await import("@/proxy");
    const request = makeRequest("http://localhost:3000/qr-generator");

    const response = await proxy(request);

    expect(response.status).not.toBe(308);
  });

  it("never redirects an unrelated Vercel-generated deployment/preview alias", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { proxy } = await import("@/proxy");
    const request = makeRequest(
      "https://qr-code-generator-git-master-beingsaleem85.vercel.app/qr-generator",
    );

    const response = await proxy(request);

    expect(response.status).not.toBe(308);
  });

  it("preserves the root path with no trailing slash duplication", async () => {
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://qr-code-generator-ebon-seven.vercel.app/");

    const response = await proxy(request);

    expect(response.headers.get("location")).toBe("https://qrforge.space/");
  });
});

describe("proxy — auth-only route gating", () => {
  it("never redirects an already-authenticated visitor away from /login — every visit must show the real form", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://qrforge.space/login");

    const response = await proxy(request);

    expect(response.status).not.toBe(307);
    expect(response.status).not.toBe(308);
  });

  it("still redirects an already-authenticated visitor away from /signup to /dashboard", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://qrforge.space/signup");

    const response = await proxy(request);

    expect(response.headers.get("location")).toBe("https://qrforge.space/dashboard");
  });

  it("redirects an unauthenticated visitor away from /dashboard to /login with a redirectTo", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { proxy } = await import("@/proxy");
    const request = makeRequest("https://qrforge.space/dashboard/qr-codes");

    const response = await proxy(request);

    expect(response.headers.get("location")).toBe(
      "https://qrforge.space/login?redirectTo=%2Fdashboard%2Fqr-codes",
    );
  });
});
