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
});

async function loadResolver(supabaseClient: unknown) {
  const { createClient } = await import("@/lib/supabase/server");
  vi.mocked(createClient).mockResolvedValue(supabaseClient as never);
  return import("@/server/services/landing-page-resolution");
}

describe("resolveLandingPage", () => {
  it("resolves an active dynamic QR to its type and payload data", async () => {
    const client = mockSupabase({
      data: { qr_type: "pdf", status: "active", payload_data: { path: "u/a/menu.pdf" } },
      error: null,
    });
    const { resolveLandingPage } = await loadResolver(client);

    const result = await resolveLandingPage("abc12345");

    expect(result).toEqual({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf" },
    });
    expect(client.rpc).toHaveBeenCalledWith("resolve_landing_page", { p_slug: "abc12345" });
  });

  it("defaults payloadData to {} when null", async () => {
    const client = mockSupabase({
      data: { qr_type: "pdf", status: "active", payload_data: null },
      error: null,
    });
    const { resolveLandingPage } = await loadResolver(client);

    const result = await resolveLandingPage("abc12345");

    expect(result).toEqual({ status: "ok", qrType: "pdf", payloadData: {} });
  });

  it("returns not_found for an unknown slug", async () => {
    const client = mockSupabase({ data: null, error: null });
    const { resolveLandingPage } = await loadResolver(client);

    expect(await resolveLandingPage("nope")).toEqual({ status: "not_found" });
  });

  it("returns not_found when the RPC call errors", async () => {
    const client = mockSupabase({ data: null, error: { message: "boom" } });
    const { resolveLandingPage } = await loadResolver(client);

    expect(await resolveLandingPage("abc12345")).toEqual({ status: "not_found" });
  });

  it("returns inactive for a paused/archived QR", async () => {
    const client = mockSupabase({
      data: { qr_type: "pdf", status: "paused", payload_data: {} },
      error: null,
    });
    const { resolveLandingPage } = await loadResolver(client);

    expect(await resolveLandingPage("abc12345")).toEqual({ status: "inactive" });
  });
});
