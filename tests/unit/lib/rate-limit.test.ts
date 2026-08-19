import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("readClientIp", () => {
  it("reads the first entry of a comma-separated x-forwarded-for chain", async () => {
    const { readClientIp } = await import("@/lib/rate-limit");
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 70.41.3.18, 150.172.238.178" });

    expect(readClientIp(headers)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    const { readClientIp } = await import("@/lib/rate-limit");
    const headers = new Headers({ "x-real-ip": "203.0.113.9" });

    expect(readClientIp(headers)).toBe("203.0.113.9");
  });

  it("returns null when neither header is present", async () => {
    const { readClientIp } = await import("@/lib/rate-limit");

    expect(readClientIp(new Headers())).toBeNull();
  });
});

describe("checkRateLimit", () => {
  async function loadWithClient(supabaseClient: unknown) {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(supabaseClient as never);
    return import("@/lib/rate-limit");
  }

  it("allows the request when the RPC returns true", async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: true, error: null }));
    const { checkRateLimit } = await loadWithClient({ rpc });

    const allowed = await checkRateLimit("redirect:1.2.3.4", {
      maxPerWindow: 60,
      windowSeconds: 60,
    });

    expect(allowed).toBe(true);
    expect(rpc).toHaveBeenCalledWith("check_rate_limit", {
      p_key: "redirect:1.2.3.4",
      p_max_per_window: 60,
      p_window_seconds: 60,
    });
  });

  it("blocks the request when the RPC returns false", async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: false, error: null }));
    const { checkRateLimit } = await loadWithClient({ rpc });

    const allowed = await checkRateLimit("redirect:1.2.3.4", {
      maxPerWindow: 60,
      windowSeconds: 60,
    });

    expect(allowed).toBe(false);
  });

  it("fails open (allows) when the RPC call itself errors", async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } }));
    const { checkRateLimit } = await loadWithClient({ rpc });

    const allowed = await checkRateLimit("redirect:1.2.3.4", {
      maxPerWindow: 60,
      windowSeconds: 60,
    });

    expect(allowed).toBe(true);
  });

  it("fails open (allows) when creating the Supabase client itself throws", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockRejectedValue(new Error("connection failed"));
    const { checkRateLimit } = await import("@/lib/rate-limit");

    const allowed = await checkRateLimit("redirect:1.2.3.4", {
      maxPerWindow: 60,
      windowSeconds: 60,
    });

    expect(allowed).toBe(true);
  });
});
