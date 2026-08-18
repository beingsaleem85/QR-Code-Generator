import { afterEach, describe, expect, it, vi } from "vitest";
import { planLabel, resolveDynamicQrAllowance, type Entitlement } from "@/lib/account/entitlements";

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

const FREE: Entitlement = {
  plan: "free",
  isLifetime: false,
  expiresAt: null,
  dynamicQrLimit: null,
};

describe("getMyEntitlement", () => {
  it("returns free for an unauthenticated caller without touching the database", async () => {
    const { getMyEntitlement } = await loadEntitlements({ user: null });

    expect(await getMyEntitlement()).toEqual(FREE);
  });

  it("returns free when the user has no entitlement row", async () => {
    const { getMyEntitlement } = await loadEntitlements({
      user: { id: "user-1" },
      chainResult: { data: null, error: null },
    });

    expect(await getMyEntitlement()).toEqual(FREE);
  });

  it("maps a real pro/lifetime/unlimited row", async () => {
    const { getMyEntitlement } = await loadEntitlements({
      user: { id: "user-1" },
      chainResult: {
        data: { plan: "pro", is_lifetime: true, expires_at: null, dynamic_qr_limit: null },
        error: null,
      },
    });

    expect(await getMyEntitlement()).toEqual({
      plan: "pro",
      isLifetime: true,
      expiresAt: null,
      dynamicQrLimit: null,
    });
  });

  it("maps a real row with a finite dynamic QR limit", async () => {
    const { getMyEntitlement } = await loadEntitlements({
      user: { id: "user-1" },
      chainResult: {
        data: { plan: "pro", is_lifetime: false, expires_at: null, dynamic_qr_limit: 100 },
        error: null,
      },
    });

    expect((await getMyEntitlement()).dynamicQrLimit).toBe(100);
  });

  it("returns free (not an error) when the query itself errors", async () => {
    const { getMyEntitlement } = await loadEntitlements({
      user: { id: "user-1" },
      chainResult: { data: null, error: { message: "connection failed" } },
    });

    expect(await getMyEntitlement()).toEqual(FREE);
  });
});

describe("planLabel", () => {
  it("labels a free plan", () => {
    expect(planLabel(FREE)).toBe("Free");
  });

  it("labels a non-lifetime pro plan", () => {
    const entitlement: Entitlement = {
      plan: "pro",
      isLifetime: false,
      expiresAt: "2027-01-01T00:00:00.000Z",
      dynamicQrLimit: 100,
    };
    expect(planLabel(entitlement)).toBe("Pro");
  });

  it("labels a lifetime pro plan distinctly", () => {
    const entitlement: Entitlement = {
      plan: "pro",
      isLifetime: true,
      expiresAt: null,
      dynamicQrLimit: null,
    };
    expect(planLabel(entitlement)).toBe("Lifetime Pro");
  });
});

describe("resolveDynamicQrAllowance", () => {
  it("allows creation when under a finite limit", () => {
    const entitlement: Entitlement = { ...FREE, plan: "pro", dynamicQrLimit: 3 };
    expect(resolveDynamicQrAllowance(entitlement, 2)).toEqual({ allowed: true, limit: 3 });
  });

  it("rejects creation when exactly at a finite limit", () => {
    const entitlement: Entitlement = { ...FREE, plan: "pro", dynamicQrLimit: 3 };
    expect(resolveDynamicQrAllowance(entitlement, 3)).toEqual({ allowed: false, limit: 3 });
  });

  it("rejects creation when already over a finite limit", () => {
    const entitlement: Entitlement = { ...FREE, plan: "pro", dynamicQrLimit: 3 };
    expect(resolveDynamicQrAllowance(entitlement, 5)).toEqual({ allowed: false, limit: 3 });
  });

  it("always allows creation for an unlimited entitlement, regardless of current count", () => {
    const unlimited: Entitlement = { ...FREE, plan: "pro", isLifetime: true, dynamicQrLimit: null };
    expect(resolveDynamicQrAllowance(unlimited, 0)).toEqual({ allowed: true, limit: null });
    expect(resolveDynamicQrAllowance(unlimited, 1000)).toEqual({ allowed: true, limit: null });
  });
});
