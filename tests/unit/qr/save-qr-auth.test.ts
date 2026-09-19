import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTH_REQUIRED } from "@/lib/qr/action-types";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function createChain(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  return chain;
}

function mockSupabase(options: {
  user?: { id: string; created_at?: string } | null;
  fromResults?: unknown[];
}) {
  const chains = (options.fromResults ?? []).map((result) => createChain(result as never));
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

const SAMPLE_INPUT = {
  name: "Sample QR",
  mode: "static" as const,
  qrType: "url" as const,
  content: { url: "https://example.com" },
  design: DEFAULT_DESIGN_CONFIG,
};

describe("Authentication Enforcement on QR Mutations", () => {
  it("rejects unauthenticated saveQrCode with AUTH_REQUIRED and zero inserts", async () => {
    const supabase = mockSupabase({ user: null });
    const { saveQrCode } = await loadActions(supabase);

    const result = await saveQrCode(SAMPLE_INPUT);

    expect(result).toEqual({ error: AUTH_REQUIRED });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("strictly derives user_id from auth session and ignores client-submitted user_id", async () => {
    const insertChain = createChain({ data: { id: "new-qr-123" } });
    const fromMock = vi.fn().mockReturnValue(insertChain);

    const supabase = {
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: "real-user-id", created_at: new Date().toISOString() } },
          }),
        ),
      },
      from: fromMock,
      storage: { from: vi.fn() },
    };

    const { saveQrCode } = await loadActions(supabase);

    // Client maliciously attempts to inject user_id: "attacker-target-id"
    const maliciousInput = {
      ...SAMPLE_INPUT,
      user_id: "attacker-target-id",
    } as unknown as Parameters<typeof saveQrCode>[0];

    const result = await saveQrCode(maliciousInput);

    expect(result).toEqual({ data: { id: "new-qr-123" } });
    expect(fromMock).toHaveBeenCalledWith("qr_codes");
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "real-user-id",
      }),
    );
    expect(insertChain.insert).not.toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "attacker-target-id",
      }),
    );
  });

  it("rejects unauthenticated duplicateQrCode with AUTH_REQUIRED", async () => {
    const supabase = mockSupabase({ user: null });
    const { duplicateQrCode } = await loadActions(supabase);

    const result = await duplicateQrCode("some-id");
    expect(result).toEqual({ error: AUTH_REQUIRED });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated updateQrCode with AUTH_REQUIRED", async () => {
    const supabase = mockSupabase({ user: null });
    const { updateQrCode } = await loadActions(supabase);

    const result = await updateQrCode("some-id", SAMPLE_INPUT);
    expect(result).toEqual({ error: AUTH_REQUIRED });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated deleteQrCode with AUTH_REQUIRED", async () => {
    const supabase = mockSupabase({ user: null });
    const { deleteQrCode } = await loadActions(supabase);

    const result = await deleteQrCode("some-id");
    expect(result).toEqual({ error: AUTH_REQUIRED });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated setQrCodeStatus with AUTH_REQUIRED", async () => {
    const supabase = mockSupabase({ user: null });
    const { setQrCodeStatus } = await loadActions(supabase);

    const result = await setQrCodeStatus("some-id", "paused");
    expect(result).toEqual({ error: AUTH_REQUIRED });
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
