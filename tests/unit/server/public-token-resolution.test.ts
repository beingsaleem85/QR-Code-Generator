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
  return import("@/server/services/public-token-resolution");
}

describe("resolvePublicToken", () => {
  it("resolves an active PDF QR to its type, payload data, and internal slug", async () => {
    const client = mockSupabase({
      data: {
        qr_type: "pdf",
        status: "active",
        payload_data: { path: "u/a/menu.pdf" },
        slug: "abc12345",
      },
      error: null,
    });
    const { resolvePublicToken } = await loadResolver(client);

    const result = await resolvePublicToken("aBcDeFgHiJkLmNoP");

    expect(result).toEqual({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf" },
      slug: "abc12345",
    });
    expect(client.rpc).toHaveBeenCalledWith("resolve_public_token", {
      p_token: "aBcDeFgHiJkLmNoP",
    });
  });

  it("defaults payloadData to {} when null", async () => {
    const client = mockSupabase({
      data: { qr_type: "pdf", status: "active", payload_data: null, slug: "abc12345" },
      error: null,
    });
    const { resolvePublicToken } = await loadResolver(client);

    const result = await resolvePublicToken("aBcDeFgHiJkLmNoP");

    expect(result).toEqual({ status: "ok", qrType: "pdf", payloadData: {}, slug: "abc12345" });
  });

  it("returns not_found for an unknown token", async () => {
    const client = mockSupabase({ data: null, error: null });
    const { resolvePublicToken } = await loadResolver(client);

    expect(await resolvePublicToken("nope")).toEqual({ status: "not_found" });
  });

  it("returns not_found when the RPC call errors", async () => {
    const client = mockSupabase({ data: null, error: { message: "boom" } });
    const { resolvePublicToken } = await loadResolver(client);

    expect(await resolvePublicToken("aBcDeFgHiJkLmNoP")).toEqual({ status: "not_found" });
  });

  it("returns inactive for a paused/archived QR", async () => {
    const client = mockSupabase({
      data: { qr_type: "pdf", status: "paused", payload_data: {}, slug: "abc12345" },
      error: null,
    });
    const { resolvePublicToken } = await loadResolver(client);

    expect(await resolvePublicToken("aBcDeFgHiJkLmNoP")).toEqual({ status: "inactive" });
  });

  it("treats a row with no slug as not_found (defensive — dynamic rows always have one)", async () => {
    const client = mockSupabase({
      data: { qr_type: "pdf", status: "active", payload_data: {}, slug: null },
      error: null,
    });
    const { resolvePublicToken } = await loadResolver(client);

    expect(await resolvePublicToken("aBcDeFgHiJkLmNoP")).toEqual({ status: "not_found" });
  });
});
