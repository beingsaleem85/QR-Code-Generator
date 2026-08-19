import { afterEach, describe, expect, it, vi } from "vitest";

function createChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  };
  return chain;
}

const getAuthenticatedUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/dal", () => ({ getAuthenticatedUser }));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

async function loadProfile(options: {
  user?: { id: string; email?: string };
  chainResult?: { data?: unknown; error?: unknown };
}) {
  const { createClient } = await import("@/lib/supabase/server");
  const chain = createChain(options.chainResult ?? { data: null, error: null });
  vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never);
  getAuthenticatedUser.mockResolvedValue(
    options.user ?? { id: "user-1", email: "user@example.com" },
  );
  return import("@/lib/account/profile");
}

describe("getMyProfile", () => {
  it("uses the real authenticated user's email — never mock/placeholder data", async () => {
    const { getMyProfile } = await loadProfile({
      user: { id: "user-1", email: "real.user@example.com" },
      chainResult: { data: { display_name: "Real User", avatar_url: null }, error: null },
    });

    const profile = await getMyProfile();

    expect(profile.email).toBe("real.user@example.com");
    expect(profile.email).not.toBe("ada@example.com");
    expect(profile.displayName).toBe("Real User");
    expect(profile.displayName).not.toBe("Ada Lovelace");
  });

  it("returns null displayName/avatarUrl when the profiles row has none set yet", async () => {
    const { getMyProfile } = await loadProfile({
      user: { id: "user-1", email: "fresh@example.com" },
      chainResult: { data: { display_name: null, avatar_url: null }, error: null },
    });

    const profile = await getMyProfile();

    expect(profile.displayName).toBeNull();
    expect(profile.avatarUrl).toBeNull();
  });

  it("returns null displayName (not an error) when the profiles row is missing entirely", async () => {
    const { getMyProfile } = await loadProfile({
      user: { id: "user-1", email: "fresh@example.com" },
      chainResult: { data: null, error: null },
    });

    const profile = await getMyProfile();

    expect(profile.displayName).toBeNull();
  });

  it("queries the profiles table scoped to the authenticated user's own id", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const chain = createChain({ data: { display_name: "X", avatar_url: null }, error: null });
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never);
    getAuthenticatedUser.mockResolvedValue({ id: "user-42", email: "u@example.com" });
    const { getMyProfile } = await import("@/lib/account/profile");

    await getMyProfile();

    expect(chain.eq).toHaveBeenCalledWith("id", "user-42");
  });
});

describe("resolveDisplayLabel", () => {
  it("uses the real display name when set", async () => {
    const { resolveDisplayLabel } = await import("@/lib/account/profile");
    expect(resolveDisplayLabel({ displayName: "Real User", email: "real@example.com" })).toBe(
      "Real User",
    );
  });

  it("trims whitespace from the display name", async () => {
    const { resolveDisplayLabel } = await import("@/lib/account/profile");
    expect(resolveDisplayLabel({ displayName: "  Real User  ", email: "real@example.com" })).toBe(
      "Real User",
    );
  });

  it("falls back to the email's local-part when no display name is set — never a hardcoded name", async () => {
    const { resolveDisplayLabel } = await import("@/lib/account/profile");
    expect(resolveDisplayLabel({ displayName: null, email: "jordan.rivera@example.com" })).toBe(
      "jordan.rivera",
    );
  });

  it("falls back for a whitespace-only display name too", async () => {
    const { resolveDisplayLabel } = await import("@/lib/account/profile");
    expect(resolveDisplayLabel({ displayName: "   ", email: "jordan@example.com" })).toBe("jordan");
  });
});
