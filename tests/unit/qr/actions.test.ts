import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTH_REQUIRED } from "@/lib/qr/action-types";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockUser = { id: "user-1" };

/** A minimal, chainable stand-in for a supabase-js query builder. Every
 * method returns the same object so calls can be chained in any order the
 * real code uses; `.then` lets `await chain` resolve directly (the
 * pattern `deleteQrCode` uses, with no trailing `.single()`). */
function createChain(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  return chain;
}

function mockSupabase(options: {
  user?: typeof mockUser | null;
  fromResults: unknown[]; // one chain's result per sequential .from() call
}) {
  const chains = options.fromResults.map((result) => createChain(result as never));
  const from = vi.fn();
  chains.forEach((chain) => from.mockReturnValueOnce(chain));

  return {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: options.user ?? null } })) },
    from,
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

const VALID_INPUT = {
  name: "My QR",
  mode: "static" as const,
  qrType: "url" as const,
  content: { url: "https://example.com" },
  design: DEFAULT_DESIGN_CONFIG,
};

describe("saveQrCode", () => {
  it("rejects an empty name before ever touching the database", async () => {
    const { saveQrCode } = await loadActions(mockSupabase({ user: mockUser, fromResults: [] }));
    const result = await saveQrCode({ ...VALID_INPUT, name: "  " });
    expect(result.error).toMatch(/name/i);
  });

  it("rejects invalid content before ever touching the database", async () => {
    const { saveQrCode } = await loadActions(mockSupabase({ user: mockUser, fromResults: [] }));
    const result = await saveQrCode({ ...VALID_INPUT, content: { url: "" } });
    expect(result.error).toMatch(/content/i);
  });

  it("returns AUTH_REQUIRED when there's no session — never inserts, never crashes", async () => {
    const { saveQrCode } = await loadActions(mockSupabase({ user: null, fromResults: [] }));
    const result = await saveQrCode(VALID_INPUT);
    expect(result.error).toBe(AUTH_REQUIRED);
  });

  it("inserts with the session's own user id — never a client-supplied one", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [{ data: { id: "new-id" }, error: null }],
    });
    const { saveQrCode } = await loadActions(client);

    const result = await saveQrCode(VALID_INPUT);

    expect(result.data).toEqual({ id: "new-id" });
    const insertedChain = client.from.mock.results[0].value;
    expect(insertedChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: mockUser.id, name: "My QR", slug: null }),
    );
  });

  it("generates a slug for dynamic mode, none for static", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [{ data: { id: "new-id" }, error: null }],
    });
    const { saveQrCode } = await loadActions(client);

    await saveQrCode({ ...VALID_INPUT, mode: "dynamic" });

    const insertedChain = client.from.mock.results[0].value;
    const insertCall = insertedChain.insert.mock.calls[0][0];
    expect(typeof insertCall.slug).toBe("string");
    expect(insertCall.slug.length).toBeGreaterThan(0);
  });

  it("stores the built payload as destination_url for a dynamic QR", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [{ data: { id: "new-id" }, error: null }],
    });
    const { saveQrCode } = await loadActions(client);

    await saveQrCode({ ...VALID_INPUT, mode: "dynamic" });

    const insertCall = client.from.mock.results[0].value.insert.mock.calls[0][0];
    expect(insertCall.destination_url).toBe("https://example.com");
  });

  it("leaves destination_url null for a static QR", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [{ data: { id: "new-id" }, error: null }],
    });
    const { saveQrCode } = await loadActions(client);

    await saveQrCode(VALID_INPUT);

    const insertCall = client.from.mock.results[0].value.insert.mock.calls[0][0];
    expect(insertCall.destination_url).toBeNull();
  });
});

describe("updateQrCode", () => {
  it("returns a clean error when the row doesn't exist or isn't the caller's (RLS-blocked)", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [{ data: null, error: null }], // the existence-check select finds nothing
    });
    const { updateQrCode } = await loadActions(client);

    const result = await updateQrCode("someone-elses-id", VALID_INPUT);

    expect(result.error).toBeTruthy();
    expect(result.data).toBeUndefined();
  });

  it("updates successfully when the row is found and owned", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: { slug: null }, error: null }, // existence check
        { data: { id: "qr-1" }, error: null }, // the update itself
      ],
    });
    const { updateQrCode } = await loadActions(client);

    const result = await updateQrCode("qr-1", VALID_INPUT);

    expect(result.data).toEqual({ id: "qr-1" });
  });

  it("re-derives destination_url from the new content, keeping the existing slug", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: { slug: "existing1" }, error: null }, // existence check
        { data: { id: "qr-1" }, error: null }, // the update itself
      ],
    });
    const { updateQrCode } = await loadActions(client);

    await updateQrCode("qr-1", {
      ...VALID_INPUT,
      mode: "dynamic",
      content: { url: "https://changed.example.com" },
    });

    const updateCall = client.from.mock.results[1].value.update.mock.calls[0][0];
    expect(updateCall.destination_url).toBe("https://changed.example.com");
    expect(updateCall.slug).toBe("existing1");
  });
});

describe("duplicateQrCode", () => {
  it("returns an error when the source QR can't be found (not yours, or deleted)", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [{ data: null, error: null }],
    });
    const { duplicateQrCode } = await loadActions(client);

    const result = await duplicateQrCode("not-mine");

    expect(result.error).toBeTruthy();
  });

  it("creates a new row with a (Copy) suffix, copying content and design", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        {
          data: {
            name: "Original",
            mode: "static",
            qr_type: "url",
            payload_data: { url: "https://example.com" },
            design_config: DEFAULT_DESIGN_CONFIG,
            destination_url: null,
          },
          error: null,
        },
        { data: { id: "copy-id" }, error: null },
      ],
    });
    const { duplicateQrCode } = await loadActions(client);

    const result = await duplicateQrCode("source-id");

    expect(result.data).toEqual({ id: "copy-id" });
    const insertChain = client.from.mock.results[1].value;
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Original (Copy)",
        user_id: mockUser.id,
        status: "active",
      }),
    );
  });

  it("copies destination_url from the source for a dynamic QR, with a fresh slug", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        {
          data: {
            name: "Original",
            mode: "dynamic",
            qr_type: "url",
            payload_data: { url: "https://example.com" },
            design_config: DEFAULT_DESIGN_CONFIG,
            destination_url: "https://example.com",
          },
          error: null,
        },
        { data: { id: "copy-id" }, error: null },
      ],
    });
    const { duplicateQrCode } = await loadActions(client);

    await duplicateQrCode("source-id");

    const insertCall = client.from.mock.results[1].value.insert.mock.calls[0][0];
    expect(insertCall.destination_url).toBe("https://example.com");
    expect(typeof insertCall.slug).toBe("string");
    expect(insertCall.slug.length).toBeGreaterThan(0);
  });
});

describe("setQrCodeStatus (archive/unarchive)", () => {
  it("updates status and returns the new value", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [{ data: { status: "archived" }, error: null }],
    });
    const { setQrCodeStatus } = await loadActions(client);

    const result = await setQrCodeStatus("qr-1", "archived");

    expect(result.data).toEqual({ status: "archived" });
  });

  it("returns a clean error when RLS blocks the update", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [{ data: null, error: { message: "no rows" } }],
    });
    const { setQrCodeStatus } = await loadActions(client);

    const result = await setQrCodeStatus("not-mine", "archived");

    expect(result.error).toBeTruthy();
  });
});

describe("deleteQrCode", () => {
  it("deletes successfully when a row was actually affected", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [{ error: null, count: 1 }],
    });
    const { deleteQrCode } = await loadActions(client);

    const result = await deleteQrCode("qr-1");

    expect(result.data).toEqual({ id: "qr-1" });
  });

  it("reports an error (not a silent success) when RLS blocks the delete — 0 rows affected", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [{ error: null, count: 0 }],
    });
    const { deleteQrCode } = await loadActions(client);

    const result = await deleteQrCode("not-mine");

    expect(result.error).toBeTruthy();
    expect(result.data).toBeUndefined();
  });

  it("requires an authenticated session", async () => {
    const { deleteQrCode } = await loadActions(mockSupabase({ user: null, fromResults: [] }));
    const result = await deleteQrCode("qr-1");
    expect(result.error).toBe(AUTH_REQUIRED);
  });
});
