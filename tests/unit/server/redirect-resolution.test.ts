import { afterEach, describe, expect, it, vi } from "vitest";

function mockSupabase(result: { data?: unknown; error?: unknown }) {
  return {
    rpc: vi.fn(() => ({
      maybeSingle: vi.fn(() => Promise.resolve(result)),
    })),
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  delete process.env.NEXT_PUBLIC_APP_URL;
});

async function loadResolver(supabaseClient: unknown) {
  const { createClient } = await import("@/lib/supabase/server");
  vi.mocked(createClient).mockResolvedValue(supabaseClient as never);
  return import("@/server/services/redirect-resolution");
}

describe("resolveDynamicQrRedirect", () => {
  it("resolves an active dynamic QR to its destination", async () => {
    const client = mockSupabase({
      data: { destination_url: "https://example.com", status: "active" },
      error: null,
    });
    const { resolveDynamicQrRedirect } = await loadResolver(client);

    const result = await resolveDynamicQrRedirect("abc12345");

    expect(result).toEqual({ status: "ok", destinationUrl: "https://example.com" });
    expect(client.rpc).toHaveBeenCalledWith("resolve_qr_redirect_checked", {
      p_slug: "abc12345",
      p_rate_limit_key: null,
      p_max_per_window: 60,
      p_window_seconds: 60,
    });
  });

  it("passes the rate-limit key and config through to the combined RPC when provided", async () => {
    const client = mockSupabase({
      data: { destination_url: "https://example.com", status: "active", rate_limited: false },
      error: null,
    });
    const { resolveDynamicQrRedirect } = await loadResolver(client);

    await resolveDynamicQrRedirect("abc12345", {
      key: "redirect:1.2.3.4",
      maxPerWindow: 30,
      windowSeconds: 60,
    });

    expect(client.rpc).toHaveBeenCalledWith("resolve_qr_redirect_checked", {
      p_slug: "abc12345",
      p_rate_limit_key: "redirect:1.2.3.4",
      p_max_per_window: 30,
      p_window_seconds: 60,
    });
  });

  it("returns rate_limited (never resolving the slug's destination) when the combined RPC reports it", async () => {
    const client = mockSupabase({
      data: { destination_url: null, status: null, rate_limited: true },
      error: null,
    });
    const { resolveDynamicQrRedirect } = await loadResolver(client);

    const result = await resolveDynamicQrRedirect("abc12345", {
      key: "redirect:1.2.3.4",
      maxPerWindow: 30,
      windowSeconds: 60,
    });

    expect(result).toEqual({ status: "rate_limited" });
  });

  it("returns not_found for an unknown slug", async () => {
    const client = mockSupabase({ data: null, error: null });
    const { resolveDynamicQrRedirect } = await loadResolver(client);

    const result = await resolveDynamicQrRedirect("nope");

    expect(result).toEqual({ status: "not_found" });
  });

  it("returns not_found when the RPC call errors", async () => {
    const client = mockSupabase({ data: null, error: { message: "boom" } });
    const { resolveDynamicQrRedirect } = await loadResolver(client);

    const result = await resolveDynamicQrRedirect("abc12345");

    expect(result).toEqual({ status: "not_found" });
  });

  it("returns inactive for a paused/archived dynamic QR", async () => {
    const client = mockSupabase({
      data: { destination_url: "https://example.com", status: "paused" },
      error: null,
    });
    const { resolveDynamicQrRedirect } = await loadResolver(client);

    const result = await resolveDynamicQrRedirect("abc12345");

    expect(result).toEqual({ status: "inactive" });
  });

  it("returns not_found for a null destination_url even if active", async () => {
    const client = mockSupabase({ data: { destination_url: null, status: "active" }, error: null });
    const { resolveDynamicQrRedirect } = await loadResolver(client);

    const result = await resolveDynamicQrRedirect("abc12345");

    expect(result).toEqual({ status: "not_found" });
  });

  it("treats an unsafe destination scheme as not_found (open-redirect defense)", async () => {
    const client = mockSupabase({
      data: { destination_url: "javascript:alert(1)", status: "active" },
      error: null,
    });
    const { resolveDynamicQrRedirect } = await loadResolver(client);

    const result = await resolveDynamicQrRedirect("abc12345");

    expect(result).toEqual({ status: "not_found" });
  });
});
