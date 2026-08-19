import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTH_REQUIRED } from "@/lib/qr/action-types";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockUser = { id: "user-1" };

function createChain(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, unknown> = {
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  return chain;
}

function mockSupabase(options: { user?: typeof mockUser | null; fromResult: unknown }) {
  return {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: options.user ?? null } })) },
    from: vi.fn(() => options.fromResult),
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
  return import("@/lib/folders/actions");
}

describe("createFolder", () => {
  it("requires an authenticated session", async () => {
    const { createFolder } = await loadActions(mockSupabase({ user: null, fromResult: null }));
    const result = await createFolder("Restaurants");
    expect(result.error).toBe(AUTH_REQUIRED);
  });

  it("rejects a blank name before ever calling the database", async () => {
    const client = mockSupabase({ user: mockUser, fromResult: createChain({}) });
    const { createFolder } = await loadActions(client);

    const result = await createFolder("   ");

    expect(result.error).toBeTruthy();
    expect(client.from).not.toHaveBeenCalled();
  });

  it("rejects a name over the max length before ever calling the database (Module 3.12)", async () => {
    const client = mockSupabase({ user: mockUser, fromResult: createChain({}) });
    const { createFolder } = await loadActions(client);

    const result = await createFolder("x".repeat(81));

    expect(result.error).toMatch(/80 characters/i);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("creates a folder for the authenticated user", async () => {
    const chain = createChain({ data: { id: "folder-1" }, error: null });
    const client = mockSupabase({ user: mockUser, fromResult: chain });
    const { createFolder } = await loadActions(client);

    const result = await createFolder("Restaurants");

    expect(chain.insert).toHaveBeenCalledWith({ user_id: "user-1", name: "Restaurants" });
    expect(result.data).toEqual({ id: "folder-1" });
  });

  it("returns a clean error on a duplicate folder name", async () => {
    const chain = createChain({ data: null, error: { code: "23505", message: "duplicate" } });
    const client = mockSupabase({ user: mockUser, fromResult: chain });
    const { createFolder } = await loadActions(client);

    const result = await createFolder("Restaurants");

    expect(result.error).toMatch(/already have a folder/i);
  });
});

describe("deleteFolder", () => {
  it("requires an authenticated session", async () => {
    const { deleteFolder } = await loadActions(mockSupabase({ user: null, fromResult: null }));
    const result = await deleteFolder("folder-1");
    expect(result.error).toBe(AUTH_REQUIRED);
  });

  it("deletes the folder when owned by the caller", async () => {
    const chain = createChain({ error: null, count: 1 });
    const client = mockSupabase({ user: mockUser, fromResult: chain });
    const { deleteFolder } = await loadActions(client);

    const result = await deleteFolder("folder-1");

    expect(chain.eq).toHaveBeenCalledWith("id", "folder-1");
    expect(result.data).toEqual({ id: "folder-1" });
  });

  it("reports an error (not a silent success) when RLS blocks the delete — 0 rows affected", async () => {
    const chain = createChain({ error: null, count: 0 });
    const client = mockSupabase({ user: mockUser, fromResult: chain });
    const { deleteFolder } = await loadActions(client);

    const result = await deleteFolder("not-mine");

    expect(result.error).toBeTruthy();
    expect(result.data).toBeUndefined();
  });
});

describe("assignQrCodeFolder", () => {
  it("requires an authenticated session", async () => {
    const { assignQrCodeFolder } = await loadActions(
      mockSupabase({ user: null, fromResult: null }),
    );
    const result = await assignQrCodeFolder("qr-1", "folder-1");
    expect(result.error).toBe(AUTH_REQUIRED);
  });

  it("assigns a folder to an owned QR code", async () => {
    const chain = createChain({ data: { id: "qr-1" }, error: null });
    const client = mockSupabase({ user: mockUser, fromResult: chain });
    const { assignQrCodeFolder } = await loadActions(client);

    const result = await assignQrCodeFolder("qr-1", "folder-1");

    expect(chain.update).toHaveBeenCalledWith({ folder_id: "folder-1" });
    expect(result.data).toEqual({ id: "qr-1" });
  });

  it("unfiles a QR code when passed a null folder id", async () => {
    const chain = createChain({ data: { id: "qr-1" }, error: null });
    const client = mockSupabase({ user: mockUser, fromResult: chain });
    const { assignQrCodeFolder } = await loadActions(client);

    await assignQrCodeFolder("qr-1", null);

    expect(chain.update).toHaveBeenCalledWith({ folder_id: null });
  });

  it("returns a clean error when the QR code isn't the caller's", async () => {
    const chain = createChain({ data: null, error: { message: "no rows" } });
    const client = mockSupabase({ user: mockUser, fromResult: chain });
    const { assignQrCodeFolder } = await loadActions(client);

    const result = await assignQrCodeFolder("not-mine", "folder-1");

    expect(result.error).toBeTruthy();
  });
});
