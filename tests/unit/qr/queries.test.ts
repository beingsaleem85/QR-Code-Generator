import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

function createChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: typeof result) => void) => resolve(result),
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

async function loadQueries(chain: ReturnType<typeof createChain>) {
  const { createClient } = await import("@/lib/supabase/server");
  vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never);
  return import("@/lib/qr/queries");
}

const ROW = {
  id: "qr-1",
  user_id: "user-1",
  folder_id: null,
  name: "My QR",
  slug: null,
  mode: "static",
  qr_type: "url",
  status: "active",
  payload_data: { url: "https://example.com" },
  destination_url: null,
  design_config: DEFAULT_DESIGN_CONFIG,
  scan_count_cached: 0,
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-02T00:00:00.000Z",
};

describe("listQrCodes", () => {
  it("maps every returned row to a QrCodeRecord", async () => {
    const chain = createChain({ data: [ROW], error: null });
    const { listQrCodes } = await loadQueries(chain);

    const records = await listQrCodes();

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ id: "qr-1", name: "My QR", qrType: "url" });
  });

  it("filters out archived rows by default", async () => {
    const chain = createChain({ data: [], error: null });
    const { listQrCodes } = await loadQueries(chain);

    await listQrCodes();

    expect(chain.neq).toHaveBeenCalledWith("status", "archived");
  });

  it("does not filter status when includeArchived is set", async () => {
    const chain = createChain({ data: [], error: null });
    const { listQrCodes } = await loadQueries(chain);

    await listQrCodes({ includeArchived: true });

    expect(chain.neq).not.toHaveBeenCalled();
  });

  it("throws on a real database error rather than silently returning an empty list", async () => {
    const chain = createChain({ data: null, error: { message: "connection failed" } });
    const { listQrCodes } = await loadQueries(chain);

    await expect(listQrCodes()).rejects.toThrow("connection failed");
  });
});

describe("getQrCodeById", () => {
  it("returns the mapped record when found", async () => {
    const chain = createChain({ data: ROW, error: null });
    const { getQrCodeById } = await loadQueries(chain);

    const record = await getQrCodeById("qr-1");

    expect(record).toMatchObject({ id: "qr-1", name: "My QR" });
  });

  it("returns null (not an error) when the row doesn't exist", async () => {
    const chain = createChain({ data: null, error: null });
    const { getQrCodeById } = await loadQueries(chain);

    expect(await getQrCodeById("missing")).toBeNull();
  });

  it("returns null identically when RLS blocks access to someone else's row", async () => {
    // maybeSingle() returns {data: null, error: null} for zero matching
    // rows regardless of *why* — RLS-blocked and genuinely-nonexistent
    // are indistinguishable at the query level, which is the point: a
    // 404 shouldn't reveal whether the id belongs to another user.
    const chain = createChain({ data: null, error: null });
    const { getQrCodeById } = await loadQueries(chain);

    expect(await getQrCodeById("someone-elses-id")).toBeNull();
  });
});
