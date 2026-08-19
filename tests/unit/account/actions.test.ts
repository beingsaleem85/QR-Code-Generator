import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTH_REQUIRED } from "@/lib/qr/action-types";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function createChain(result: { error?: unknown }) {
  const chain: Record<string, unknown> = {
    update: vi.fn(() => chain),
    eq: vi.fn(() => Promise.resolve(result)),
  };
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

async function loadActions(options: {
  user?: { id: string } | null;
  chainResult?: { error?: unknown };
}) {
  const { createClient } = await import("@/lib/supabase/server");
  const chain = createChain(options.chainResult ?? { error: null });
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: options.user ?? null } })) },
    from: vi.fn(() => chain),
  } as never);
  const actions = await import("@/lib/account/actions");
  return { ...actions, chain };
}

const AUTHED_USER = { id: "user-1" };

describe("updateDisplayName", () => {
  it("rejects an empty display name before ever touching the database", async () => {
    const { updateDisplayName } = await loadActions({ user: AUTHED_USER });

    const result = await updateDisplayName("   ");

    expect(result.error).toBeTruthy();
    expect(result.data).toBeUndefined();
  });

  it("rejects a display name over the max length", async () => {
    const { updateDisplayName } = await loadActions({ user: AUTHED_USER });

    const result = await updateDisplayName("x".repeat(81));

    expect(result.error).toMatch(/too long/i);
  });

  it("trims whitespace before saving", async () => {
    const { updateDisplayName, chain } = await loadActions({ user: AUTHED_USER });

    const result = await updateDisplayName("  Real Name  ");

    expect(result.data).toEqual({ displayName: "Real Name" });
    expect(chain.update).toHaveBeenCalledWith({ display_name: "Real Name" });
  });

  it("scopes the update to the authenticated user's own row — never a client-supplied id", async () => {
    const { updateDisplayName, chain } = await loadActions({ user: { id: "user-77" } });

    await updateDisplayName("Real Name");

    expect(chain.eq).toHaveBeenCalledWith("id", "user-77");
  });

  it("returns AUTH_REQUIRED when there's no session — never writes, never crashes", async () => {
    const { updateDisplayName, chain } = await loadActions({ user: null });

    const result = await updateDisplayName("Real Name");

    expect(result.error).toBe(AUTH_REQUIRED);
    expect(chain.update).not.toHaveBeenCalled();
  });

  it("never touches account_entitlements — no path to plan/is_lifetime/dynamic_qr_limit", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const chain = createChain({ error: null });
    const from = vi.fn(() => chain);
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: AUTHED_USER } })) },
      from,
    } as never);
    const { updateDisplayName } = await import("@/lib/account/actions");

    await updateDisplayName("Real Name");

    expect(from).toHaveBeenCalledWith("profiles");
    expect(from).not.toHaveBeenCalledWith("account_entitlements");
  });

  it("returns a safe, generic error — never a raw database error — when the update fails", async () => {
    const { updateDisplayName } = await loadActions({
      user: AUTHED_USER,
      chainResult: { error: { message: "permission denied for table profiles" } },
    });

    const result = await updateDisplayName("Real Name");

    expect(result.error).toBeTruthy();
    expect(result.error).not.toContain("permission denied");
    expect(result.error).not.toContain("SQL");
  });
});
