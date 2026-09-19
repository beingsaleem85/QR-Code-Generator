import { afterEach, describe, expect, it, vi } from "vitest";
import { TRIAL_EXPIRED } from "@/lib/qr/action-types";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function createChain(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  return chain;
}

function mockSupabase(options: {
  user?: { id: string; created_at?: string } | null;
  fromResults: unknown[];
}) {
  const chains = options.fromResults.map((result) => createChain(result as never));
  const from = vi.fn();
  chains.forEach((chain) => from.mockReturnValueOnce(chain));

  return {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: options.user ?? null } })) },
    from,
    storage: { from: vi.fn() },
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

async function loadActions(supabaseClient: unknown) {
  const { createClient } = await import("@/lib/supabase/server");
  vi.mocked(createClient).mockResolvedValue(supabaseClient as never);
  return import("@/lib/qr/actions");
}

const STATIC_INPUT = {
  name: "Static Test",
  mode: "static" as const,
  qrType: "url" as const,
  content: { url: "https://example.com" },
  design: DEFAULT_DESIGN_CONFIG,
};

const DYNAMIC_INPUT = {
  name: "Dynamic Test",
  mode: "dynamic" as const,
  qrType: "url" as const,
  content: { url: "https://example.com" },
  design: DEFAULT_DESIGN_CONFIG,
};

describe("Server-Side QR Creation Free Trial Enforcement", () => {
  const now = Date.now();
  const activeCreatedAt = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
  const expiredCreatedAt = new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(); // 20 days ago

  it("rejects static QR creation when Free account trial has expired", async () => {
    const client = mockSupabase({
      user: { id: "user-expired", created_at: expiredCreatedAt },
      fromResults: [
        { data: null, error: null }, // account_entitlements (free)
      ],
    });
    const { saveQrCode } = await loadActions(client);

    const result = await saveQrCode(STATIC_INPUT);

    expect(result.error).toBe(TRIAL_EXPIRED);
    expect(result.data).toBeUndefined();
    // Entitlement looked up, insert NEVER called
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("rejects dynamic QR creation when Free account trial has expired", async () => {
    const client = mockSupabase({
      user: { id: "user-expired", created_at: expiredCreatedAt },
      fromResults: [
        { data: null, error: null }, // account_entitlements (free)
      ],
    });
    const { saveQrCode } = await loadActions(client);

    const result = await saveQrCode(DYNAMIC_INPUT);

    expect(result.error).toBe(TRIAL_EXPIRED);
    expect(result.data).toBeUndefined();
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("allows static QR creation when Free account trial is active (< 14 days)", async () => {
    const client = mockSupabase({
      user: { id: "user-active", created_at: activeCreatedAt },
      fromResults: [
        { data: { id: "qr-new" }, error: null }, // insert into qr_codes
      ],
    });
    const { saveQrCode } = await loadActions(client);

    const result = await saveQrCode(STATIC_INPUT);

    expect(result.data).toEqual({ id: "qr-new" });
    expect(result.error).toBeUndefined();
  });

  it("allows dynamic QR creation when Free account trial is active (< 14 days)", async () => {
    const client = mockSupabase({
      user: { id: "user-active", created_at: activeCreatedAt },
      fromResults: [
        { data: null, error: null }, // account_entitlements
        { data: { id: "qr-dynamic" }, error: null }, // insert into qr_codes
      ],
    });
    const { saveQrCode } = await loadActions(client);

    const result = await saveQrCode(DYNAMIC_INPUT);

    expect(result.data).toEqual({ id: "qr-dynamic" });
    expect(result.error).toBeUndefined();
  });

  it("allows QR creation for Pro user even if account is older than 14 days", async () => {
    const client = mockSupabase({
      user: { id: "user-pro", created_at: expiredCreatedAt },
      fromResults: [
        { data: { plan: "pro", is_lifetime: false, expires_at: null, dynamic_qr_limit: null }, error: null }, // account_entitlements
        { data: { id: "qr-pro" }, error: null }, // insert into qr_codes
      ],
    });
    const { saveQrCode } = await loadActions(client);

    const result = await saveQrCode(DYNAMIC_INPUT);

    expect(result.data).toEqual({ id: "qr-pro" });
    expect(result.error).toBeUndefined();
  });

  it("allows QR creation for Lifetime Pro user even if account is older than 14 days", async () => {
    const client = mockSupabase({
      user: { id: "user-lifetime", created_at: expiredCreatedAt },
      fromResults: [
        { data: { plan: "pro", is_lifetime: true, expires_at: null, dynamic_qr_limit: null }, error: null }, // account_entitlements
        { data: { id: "qr-lifetime" }, error: null }, // insert into qr_codes
      ],
    });
    const { saveQrCode } = await loadActions(client);

    const result = await saveQrCode(STATIC_INPUT);

    expect(result.data).toEqual({ id: "qr-lifetime" });
    expect(result.error).toBeUndefined();
  });

  it("rejects duplicateQrCode when Free account trial has expired", async () => {
    const client = mockSupabase({
      user: { id: "user-expired", created_at: expiredCreatedAt },
      fromResults: [
        { data: { name: "Original", mode: "static", qr_type: "url", payload_data: {}, design_config: {}, destination_url: null }, error: null }, // fetch source
        { data: null, error: null }, // account_entitlements (free)
      ],
    });
    const { duplicateQrCode } = await loadActions(client);

    const result = await duplicateQrCode("source-id");

    expect(result.error).toBe(TRIAL_EXPIRED);
    expect(result.data).toBeUndefined();
  });

  it("allows duplicateQrCode for Pro user older than 14 days", async () => {
    const client = mockSupabase({
      user: { id: "user-pro", created_at: expiredCreatedAt },
      fromResults: [
        { data: { name: "Original", mode: "static", qr_type: "url", payload_data: {}, design_config: {}, destination_url: null }, error: null }, // fetch source
        { data: { plan: "pro", is_lifetime: false, expires_at: null, dynamic_qr_limit: null }, error: null }, // account_entitlements
        { data: { id: "copy-id" }, error: null }, // insert copy
      ],
    });
    const { duplicateQrCode } = await loadActions(client);

    const result = await duplicateQrCode("source-id");

    expect(result.data).toEqual({ id: "copy-id" });
    expect(result.error).toBeUndefined();
  });
});
