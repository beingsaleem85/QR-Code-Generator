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
  user?: typeof mockUser | null;
  fromResults: unknown[]; // one chain's result per sequential .from() call
  storage?: { from: ReturnType<typeof vi.fn> };
}) {
  const chains = options.fromResults.map((result) => createChain(result as never));
  const from = vi.fn();
  chains.forEach((chain) => from.mockReturnValueOnce(chain));

  return {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: options.user ?? null } })) },
    from,
    storage: options.storage ?? { from: vi.fn() },
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

  it("rejects a name over the max length before ever touching the database (Module 3.12)", async () => {
    const { saveQrCode } = await loadActions(mockSupabase({ user: mockUser, fromResults: [] }));
    const result = await saveQrCode({ ...VALID_INPUT, name: "x".repeat(121) });
    expect(result.error).toMatch(/120 characters/i);
  });

  it("accepts a name at exactly the max length", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [{ data: { id: "qr-1" }, error: null }],
    });
    const { saveQrCode } = await loadActions(client);
    const result = await saveQrCode({ ...VALID_INPUT, name: "x".repeat(120) });
    expect(result.data).toEqual({ id: "qr-1" });
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
      fromResults: [
        { data: null, error: null }, // entitlement lookup: no row -> free/unlimited
        { data: { id: "new-id" }, error: null }, // insert
      ],
    });
    const { saveQrCode } = await loadActions(client);

    await saveQrCode({ ...VALID_INPUT, mode: "dynamic" });

    const insertedChain = client.from.mock.results[1].value;
    const insertCall = insertedChain.insert.mock.calls[0][0];
    expect(typeof insertCall.slug).toBe("string");
    expect(insertCall.slug.length).toBeGreaterThan(0);
  });

  it("stores the built payload as destination_url for a dynamic QR", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: null, error: null }, // entitlement lookup
        { data: { id: "new-id" }, error: null }, // insert
      ],
    });
    const { saveQrCode } = await loadActions(client);

    await saveQrCode({ ...VALID_INPUT, mode: "dynamic" });

    const insertCall = client.from.mock.results[1].value.insert.mock.calls[0][0];
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

  it("skips the dynamic-QR count query entirely for an unlimited entitlement", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: null, error: null }, // entitlement lookup: unlimited
        { data: { id: "new-id" }, error: null }, // insert
      ],
    });
    const { saveQrCode } = await loadActions(client);

    const result = await saveQrCode({ ...VALID_INPUT, mode: "dynamic" });

    expect(result.data).toEqual({ id: "new-id" });
    // Exactly 2 .from() calls: entitlement lookup + insert — no count query.
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it("rejects creating a dynamic QR when the account is exactly at its finite limit", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        {
          data: { plan: "pro", is_lifetime: false, expires_at: null, dynamic_qr_limit: 3 },
          error: null,
        }, // entitlement lookup
        { data: null, error: null, count: 3 }, // current dynamic QR count
      ],
    });
    const { saveQrCode } = await loadActions(client);

    const result = await saveQrCode({ ...VALID_INPUT, mode: "dynamic" });

    expect(result.error).toMatch(/limit of 3/i);
    expect(result.data).toBeUndefined();
    // Never reaches the insert — only the entitlement + count lookups ran.
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it("translates the database-level quota trigger's raw exception into a safe message — never the raw Postgres text", async () => {
    // Simulates the app-level pre-check passing (e.g. a stale read in a
    // genuine concurrent-request race) while the database's own trigger
    // still correctly rejects the insert — the last line of defense, not
    // the normal path.
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: null, error: null }, // entitlement lookup: app-level check sees unlimited
        {
          data: null,
          error: {
            message:
              "DYNAMIC_QR_QUOTA_EXCEEDED: account user-1 has reached its dynamic QR limit of 1",
            code: "P0001",
          },
        }, // insert: rejected by the DB trigger anyway
      ],
    });
    const { saveQrCode } = await loadActions(client);

    const result = await saveQrCode({ ...VALID_INPUT, mode: "dynamic" });

    expect(result.error).toBe(
      "You've reached your plan's limit of dynamic QR codes. Archive or delete one to create another, or upgrade your plan.",
    );
    expect(result.error).not.toContain("DYNAMIC_QR_QUOTA_EXCEEDED");
    expect(result.error).not.toContain("P0001");
  });

  it("mints a public_token for a PDF QR created with openDirectly on", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: null, error: null }, // entitlement lookup
        { data: { id: "new-id" }, error: null }, // insert
        { data: [], error: null }, // syncQrAssets: existing assets (none yet)
        { data: null, error: null }, // syncQrAssets: upsert
      ],
    });
    const { saveQrCode } = await loadActions(client);

    await saveQrCode({
      ...VALID_INPUT,
      mode: "dynamic",
      qrType: "pdf",
      content: {
        path: "u/a/menu.pdf",
        fileName: "menu.pdf",
        sizeBytes: 100,
        mimeType: "application/pdf",
        openDirectly: true,
      },
    });

    const insertCall = client.from.mock.results[1].value.insert.mock.calls[0][0];
    expect(typeof insertCall.public_token).toBe("string");
    expect(insertCall.public_token.length).toBeGreaterThanOrEqual(16);
  });

  it("does not mint a public_token for a PDF QR with openDirectly off", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: null, error: null },
        { data: { id: "new-id" }, error: null },
        { data: [], error: null },
        { data: null, error: null },
      ],
    });
    const { saveQrCode } = await loadActions(client);

    await saveQrCode({
      ...VALID_INPUT,
      mode: "dynamic",
      qrType: "pdf",
      content: {
        path: "u/a/menu.pdf",
        fileName: "menu.pdf",
        sizeBytes: 100,
        mimeType: "application/pdf",
        openDirectly: false,
      },
    });

    const insertCall = client.from.mock.results[1].value.insert.mock.calls[0][0];
    expect(insertCall.public_token).toBeNull();
  });

  it("does not mint a public_token for a non-PDF dynamic QR", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: null, error: null },
        { data: { id: "new-id" }, error: null },
      ],
    });
    const { saveQrCode } = await loadActions(client);

    await saveQrCode({ ...VALID_INPUT, mode: "dynamic" });

    const insertCall = client.from.mock.results[1].value.insert.mock.calls[0][0];
    expect(insertCall.public_token).toBeNull();
  });

  it("gives two separately created PDF direct-open QRs different public tokens", async () => {
    const clientA = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: null, error: null },
        { data: { id: "id-a" }, error: null },
        { data: [], error: null },
        { data: null, error: null },
      ],
    });
    const { saveQrCode: saveA } = await loadActions(clientA);
    await saveA({
      ...VALID_INPUT,
      mode: "dynamic",
      qrType: "pdf",
      content: {
        path: "u/a/menu.pdf",
        fileName: "menu.pdf",
        sizeBytes: 100,
        mimeType: "application/pdf",
        openDirectly: true,
      },
    });
    const tokenA = clientA.from.mock.results[1].value.insert.mock.calls[0][0].public_token;

    const clientB = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: null, error: null },
        { data: { id: "id-b" }, error: null },
        { data: [], error: null },
        { data: null, error: null },
      ],
    });
    const { saveQrCode: saveB } = await loadActions(clientB);
    await saveB({
      ...VALID_INPUT,
      mode: "dynamic",
      qrType: "pdf",
      content: {
        path: "u/b/menu.pdf",
        fileName: "menu.pdf",
        sizeBytes: 100,
        mimeType: "application/pdf",
        openDirectly: true,
      },
    });
    const tokenB = clientB.from.mock.results[1].value.insert.mock.calls[0][0].public_token;

    expect(tokenA).not.toBe(tokenB);
  });

  it("allows creating a dynamic QR when under a finite limit", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        {
          data: { plan: "pro", is_lifetime: false, expires_at: null, dynamic_qr_limit: 3 },
          error: null,
        }, // entitlement lookup
        { data: null, error: null, count: 2 }, // current dynamic QR count
        { data: { id: "new-id" }, error: null }, // insert
      ],
    });
    const { saveQrCode } = await loadActions(client);

    const result = await saveQrCode({ ...VALID_INPUT, mode: "dynamic" });

    expect(result.data).toEqual({ id: "new-id" });
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

  it("translates the database-level quota trigger's rejection on a static->dynamic conversion too", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: { slug: null, mode: "static" }, error: null }, // existence check
        { data: null, error: null }, // entitlement lookup: app-level check sees unlimited
        {
          data: null,
          error: {
            message:
              "DYNAMIC_QR_QUOTA_EXCEEDED: account user-1 has reached its dynamic QR limit of 1",
            code: "P0001",
          },
        }, // the update itself: rejected by the DB trigger anyway
      ],
    });
    const { updateQrCode } = await loadActions(client);

    const result = await updateQrCode("qr-1", { ...VALID_INPUT, mode: "dynamic" });

    expect(result.error).toBe(
      "You've reached your plan's limit of dynamic QR codes. Archive or delete one to create another, or upgrade your plan.",
    );
    expect(result.error).not.toContain("DYNAMIC_QR_QUOTA_EXCEEDED");
  });

  it("re-derives destination_url from the new content, keeping the existing slug", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: { slug: "existing1", mode: "dynamic" }, error: null }, // existence check — already dynamic
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

  it("checks the dynamic-QR allowance only when a static QR is converted to dynamic", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: { slug: null, mode: "static" }, error: null }, // existence check — was static
        {
          data: { plan: "pro", is_lifetime: false, expires_at: null, dynamic_qr_limit: 1 },
          error: null,
        }, // entitlement lookup
        { data: null, error: null, count: 1 }, // already at the limit
      ],
    });
    const { updateQrCode } = await loadActions(client);

    const result = await updateQrCode("qr-1", { ...VALID_INPUT, mode: "dynamic" });

    expect(result.error).toMatch(/limit of 1/i);
    // Never reaches the update — existence check + entitlement + count only.
    expect(client.from).toHaveBeenCalledTimes(3);
  });

  it("never touches public_token on update — it stays fixed for the life of the record", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: { slug: "existing1", mode: "dynamic" }, error: null }, // existence check
        { data: { id: "qr-1" }, error: null }, // the update itself
        { data: [], error: null }, // syncQrAssets: existing assets
        { data: null, error: null }, // syncQrAssets: upsert
      ],
    });
    const { updateQrCode } = await loadActions(client);

    await updateQrCode("qr-1", {
      ...VALID_INPUT,
      mode: "dynamic",
      qrType: "pdf",
      content: {
        path: "u/a/menu.pdf",
        fileName: "menu.pdf",
        sizeBytes: 100,
        mimeType: "application/pdf",
        openDirectly: true,
      },
    });

    const updateCall = client.from.mock.results[1].value.update.mock.calls[0][0];
    expect(updateCall).not.toHaveProperty("public_token");
  });

  it("does not re-check the allowance when an already-dynamic QR is merely edited", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: { slug: "existing1", mode: "dynamic" }, error: null }, // existence check
        { data: { id: "qr-1" }, error: null }, // the update itself
      ],
    });
    const { updateQrCode } = await loadActions(client);

    const result = await updateQrCode("qr-1", { ...VALID_INPUT, mode: "dynamic" });

    expect(result.data).toEqual({ id: "qr-1" });
    // Only the existence check + update — no entitlement lookup at all.
    expect(client.from).toHaveBeenCalledTimes(2);
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
        { data: null, error: null }, // entitlement lookup: unlimited
        { data: { id: "copy-id" }, error: null },
      ],
    });
    const { duplicateQrCode } = await loadActions(client);

    await duplicateQrCode("source-id");

    const insertCall = client.from.mock.results[2].value.insert.mock.calls[0][0];
    expect(insertCall.destination_url).toBe("https://example.com");
    expect(typeof insertCall.slug).toBe("string");
    expect(insertCall.slug.length).toBeGreaterThan(0);
  });

  it("mints a fresh public_token for a duplicate of a PDF direct-open QR, different from the source's", async () => {
    const copy = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        {
          data: {
            name: "Original",
            mode: "dynamic",
            qr_type: "pdf",
            payload_data: {
              path: "u/a/menu.pdf",
              fileName: "menu.pdf",
              sizeBytes: 100,
              mimeType: "application/pdf",
              openDirectly: true,
            },
            design_config: DEFAULT_DESIGN_CONFIG,
            destination_url: null,
          },
          error: null,
        },
        { data: null, error: null }, // entitlement lookup: unlimited
        { data: { id: "copy-id" }, error: null }, // the qr_codes insert
        { data: null, error: null }, // duplicateQrAssets' qr_assets insert
        { data: null, error: null }, // the payload_data update
      ],
      storage: { from: vi.fn(() => ({ copy })) },
    });
    const { duplicateQrCode } = await loadActions(client);

    await duplicateQrCode("source-id");

    const insertCall = client.from.mock.results[2].value.insert.mock.calls[0][0];
    expect(typeof insertCall.public_token).toBe("string");
    expect(insertCall.public_token).not.toBe("source-qr-token");
  });

  it("does not mint a public_token for a duplicate whose source had openDirectly off", async () => {
    const copy = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        {
          data: {
            name: "Original",
            mode: "dynamic",
            qr_type: "pdf",
            payload_data: {
              path: "u/a/menu.pdf",
              fileName: "menu.pdf",
              sizeBytes: 100,
              mimeType: "application/pdf",
              openDirectly: false,
            },
            design_config: DEFAULT_DESIGN_CONFIG,
            destination_url: null,
          },
          error: null,
        },
        { data: null, error: null },
        { data: { id: "copy-id" }, error: null },
        { data: null, error: null },
        { data: null, error: null },
      ],
      storage: { from: vi.fn(() => ({ copy })) },
    });
    const { duplicateQrCode } = await loadActions(client);

    await duplicateQrCode("source-id");

    const insertCall = client.from.mock.results[2].value.insert.mock.calls[0][0];
    expect(insertCall.public_token).toBeNull();
  });

  it("rejects duplicating a dynamic QR when the account is at its finite limit", async () => {
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
        {
          data: { plan: "pro", is_lifetime: false, expires_at: null, dynamic_qr_limit: 2 },
          error: null,
        },
        { data: null, error: null, count: 2 },
      ],
    });
    const { duplicateQrCode } = await loadActions(client);

    const result = await duplicateQrCode("source-id");

    expect(result.error).toMatch(/limit of 2/i);
  });

  it("translates the database-level quota trigger's rejection on duplicate into a safe message too", async () => {
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
        }, // source fetch
        { data: null, error: null }, // entitlement lookup: app-level check sees unlimited
        {
          data: null,
          error: {
            message:
              "DYNAMIC_QR_QUOTA_EXCEEDED: account user-1 has reached its dynamic QR limit of 2",
            code: "P0001",
          },
        }, // insert: rejected by the DB trigger anyway
      ],
    });
    const { duplicateQrCode } = await loadActions(client);

    const result = await duplicateQrCode("source-id");

    expect(result.error).toBe(
      "You've reached your plan's limit of dynamic QR codes. Archive or delete one to create another, or upgrade your plan.",
    );
    expect(result.error).not.toContain("DYNAMIC_QR_QUOTA_EXCEEDED");
    expect(result.data).toBeUndefined();
  });

  it("gives a storage-backed duplicate its own independent copy of the asset, not a shared path", async () => {
    const copy = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        {
          data: {
            name: "Original",
            mode: "dynamic",
            qr_type: "pdf",
            payload_data: {
              path: "user-1/orig/menu.pdf",
              fileName: "menu.pdf",
              sizeBytes: 100,
              mimeType: "application/pdf",
            },
            design_config: DEFAULT_DESIGN_CONFIG,
            destination_url: null,
          },
          error: null,
        },
        { data: null, error: null }, // entitlement lookup: no row -> free/unlimited
        { data: { id: "copy-id" }, error: null }, // the qr_codes insert
        { data: null, error: null }, // duplicateQrAssets' qr_assets insert
        { data: null, error: null }, // the payload_data update
      ],
      storage: { from: vi.fn(() => ({ copy })) },
    });
    const { duplicateQrCode } = await loadActions(client);

    const result = await duplicateQrCode("source-id");

    expect(result.data).toEqual({ id: "copy-id" });
    expect(copy).toHaveBeenCalledWith(
      "user-1/orig/menu.pdf",
      expect.stringMatching(/^user-1\/[0-9a-f-]+\/menu\.pdf$/),
    );
    const updateChain = client.from.mock.results[4].value;
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        payload_data: expect.objectContaining({
          path: expect.stringMatching(/^user-1\/[0-9a-f-]+\/menu\.pdf$/),
        }),
      }),
    );
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
      fromResults: [
        { data: { id: "qr-1" }, error: null }, // existence check
        { data: [], error: null }, // no associated qr_assets to clean up
        { error: null, count: 1 }, // the qr_codes delete
      ],
    });
    const { deleteQrCode } = await loadActions(client);

    const result = await deleteQrCode("qr-1");

    expect(result.data).toEqual({ id: "qr-1" });
  });

  it("reports a safe error when the QR doesn't exist or isn't owned by this user", async () => {
    const client = mockSupabase({
      user: mockUser,
      fromResults: [{ data: null, error: null }], // existence check: not found
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

  it("removes associated Storage objects and qr_assets rows for a file-based QR, before deleting the QR itself", async () => {
    const removeMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: { id: "qr-1" }, error: null }, // existence check
        {
          data: [{ id: "asset-1", bucket: "qr-documents", path: "user-1/asset-1/menu.pdf" }],
          error: null,
        },
        { error: null }, // the qr_assets delete
        { error: null, count: 1 }, // the qr_codes delete
      ],
      storage: { from: vi.fn(() => ({ remove: removeMock })) },
    });
    const { deleteQrCode } = await loadActions(client);

    const result = await deleteQrCode("qr-1");

    expect(client.storage.from).toHaveBeenCalledWith("qr-documents");
    expect(removeMock).toHaveBeenCalledWith(["user-1/asset-1/menu.pdf"]);
    expect(result.data).toEqual({ id: "qr-1" });
  });

  it("never deletes the QR row (or the qr_assets row) if removing the Storage object fails — no orphan, no data loss, just a safe retryable error", async () => {
    const removeMock = vi.fn(() =>
      Promise.resolve({ data: null, error: { message: "storage 500" } }),
    );
    const client = mockSupabase({
      user: mockUser,
      fromResults: [
        { data: { id: "qr-1" }, error: null }, // existence check
        {
          data: [{ id: "asset-1", bucket: "qr-documents", path: "user-1/asset-1/menu.pdf" }],
          error: null,
        },
      ],
      storage: { from: vi.fn(() => ({ remove: removeMock })) },
    });
    const { deleteQrCode } = await loadActions(client);

    const result = await deleteQrCode("qr-1");

    expect(result.error).toBeTruthy();
    expect(result.error).not.toContain("storage 500");
    expect(result.data).toBeUndefined();
    // Only the existence check + asset fetch ran — never reached the
    // qr_assets delete or the qr_codes delete.
    expect(client.from).toHaveBeenCalledTimes(2);
  });
});
