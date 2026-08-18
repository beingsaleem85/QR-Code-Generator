import { afterEach, describe, expect, it, vi } from "vitest";
import { planLabel, type Entitlement } from "@/lib/account/entitlements";

function createChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  };
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

async function loadEntitlements(options: {
  user?: { id: string } | null;
  chainResult?: { data?: unknown; error?: unknown };
}) {
  const { createClient } = await import("@/lib/supabase/server");
  const chain = createChain(options.chainResult ?? { data: null, error: null });
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: options.user ?? null } })) },
    from: vi.fn(() => chain),
  } as never);
  return import("@/lib/account/entitlements");
}

describe("getMyEntitlement", () => {
  it("returns free for an unauthenticated caller without touching the database", async () => {
    const { getMyEntitlement } = await loadEntitlements({ user: null });

    expect(await getMyEntitlement()).toEqual({ plan: "free", isLifetime: false, expiresAt: null });
  });

  it("returns free when the user has no entitlement row", async () => {
    const { getMyEntitlement } = await loadEntitlements({
      user: { id: "user-1" },
      chainResult: { data: null, error: null },
    });

    expect(await getMyEntitlement()).toEqual({ plan: "free", isLifetime: false, expiresAt: null });
  });

  it("maps a real pro/lifetime row", async () => {
    const { getMyEntitlement } = await loadEntitlements({
      user: { id: "user-1" },
      chainResult: {
        data: { plan: "pro", is_lifetime: true, expires_at: null },
        error: null,
      },
    });

    expect(await getMyEntitlement()).toEqual({ plan: "pro", isLifetime: true, expiresAt: null });
  });

  it("returns free (not an error) when the query itself errors", async () => {
    const { getMyEntitlement } = await loadEntitlements({
      user: { id: "user-1" },
      chainResult: { data: null, error: { message: "connection failed" } },
    });

    expect(await getMyEntitlement()).toEqual({ plan: "free", isLifetime: false, expiresAt: null });
  });
});

describe("planLabel", () => {
  it("labels a free plan", () => {
    const entitlement: Entitlement = { plan: "free", isLifetime: false, expiresAt: null };
    expect(planLabel(entitlement)).toBe("Free");
  });

  it("labels a non-lifetime pro plan", () => {
    const entitlement: Entitlement = {
      plan: "pro",
      isLifetime: false,
      expiresAt: "2027-01-01T00:00:00.000Z",
    };
    expect(planLabel(entitlement)).toBe("Pro");
  });

  it("labels a lifetime pro plan distinctly", () => {
    const entitlement: Entitlement = { plan: "pro", isLifetime: true, expiresAt: null };
    expect(planLabel(entitlement)).toBe("Lifetime Pro");
  });
});
