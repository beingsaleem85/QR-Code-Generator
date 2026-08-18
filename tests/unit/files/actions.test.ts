import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTH_REQUIRED } from "@/lib/qr/action-types";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockUser = { id: "user-1" };

function createChain(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  return chain;
}

function mockSupabase(options: {
  user?: typeof mockUser | null;
  fromResults: unknown[];
  removeError?: { message: string } | null;
}) {
  const chains = options.fromResults.map((result) => createChain(result as never));
  const from = vi.fn();
  chains.forEach((chain) => from.mockReturnValueOnce(chain));
  const remove = vi.fn(() => Promise.resolve({ data: null, error: options.removeError ?? null }));

  return {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: options.user ?? null } })) },
    from,
    storage: { from: vi.fn(() => ({ remove })) },
    __remove: remove,
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
  return import("@/lib/files/actions");
}

describe("deleteQrAsset", () => {
  it("requires an authenticated session", async () => {
    const { deleteQrAsset } = await loadActions(mockSupabase({ user: null, fromResults: [] }));
    const result = await deleteQrAsset("asset-1");
    expect(result.error).toBe(AUTH_REQUIRED);
  });

  it("returns a clean error when the asset doesn't exist or isn't the caller's", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [{ data: null, error: null }],
    });
    const { deleteQrAsset } = await loadActions(client);

    const result = await deleteQrAsset("not-mine");

    expect(result.error).toBeTruthy();
  });

  it("removes the Storage object and the qr_assets row on success", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: { bucket: "qr-documents", path: "user-1/asset-1/menu.pdf" }, error: null },
        { error: null, count: 1 },
      ],
    });
    const { deleteQrAsset } = await loadActions(client);

    const result = await deleteQrAsset("asset-1");

    expect(client.storage.from).toHaveBeenCalledWith("qr-documents");
    expect(client.__remove).toHaveBeenCalledWith(["user-1/asset-1/menu.pdf"]);
    expect(result.data).toEqual({ id: "asset-1" });
  });

  it("reports an error (not a silent success) when RLS blocks the delete — 0 rows affected", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: { bucket: "qr-documents", path: "user-1/asset-1/menu.pdf" }, error: null },
        { error: null, count: 0 },
      ],
    });
    const { deleteQrAsset } = await loadActions(client);

    const result = await deleteQrAsset("not-mine");

    expect(result.error).toBeTruthy();
    expect(result.data).toBeUndefined();
  });
});
