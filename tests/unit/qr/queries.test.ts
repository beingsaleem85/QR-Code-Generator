import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

function createChain(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    is: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    range: vi.fn(() => chain),
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

const SCAN_EVENT_ROW = {
  scanned_at: "2026-08-12T09:00:00.000Z",
  country_code: "US",
  device_type: "mobile",
  os: "iOS",
  browser: "Safari",
};

describe("listScanEvents", () => {
  it("maps every returned row to a QrScanEvent", async () => {
    const chain = createChain({ data: [SCAN_EVENT_ROW], error: null });
    const { listScanEvents } = await loadQueries(chain);

    const events = await listScanEvents("qr-1");

    expect(events).toEqual([
      {
        scannedAt: "2026-08-12T09:00:00.000Z",
        countryCode: "US",
        deviceType: "mobile",
        os: "iOS",
        browser: "Safari",
      },
    ]);
  });

  it("scopes the query to the given QR code and a bounded time window", async () => {
    const chain = createChain({ data: [], error: null });
    const { listScanEvents } = await loadQueries(chain);

    await listScanEvents("qr-1");

    expect(chain.eq).toHaveBeenCalledWith("qr_code_id", "qr-1");
    expect(chain.gte).toHaveBeenCalledWith("scanned_at", expect.any(String));
  });

  it("throws on a real database error rather than silently returning an empty list", async () => {
    const chain = createChain({ data: null, error: { message: "connection failed" } });
    const { listScanEvents } = await loadQueries(chain);

    await expect(listScanEvents("qr-1")).rejects.toThrow("connection failed");
  });
});

describe("countDynamicQrCodes", () => {
  it("returns the count from the database", async () => {
    const chain = createChain({ data: null, error: null, count: 4 });
    const { countDynamicQrCodes } = await loadQueries(chain);

    expect(await countDynamicQrCodes()).toBe(4);
  });

  it("filters to dynamic mode, excluding archived", async () => {
    const chain = createChain({ data: null, error: null, count: 0 });
    const { countDynamicQrCodes } = await loadQueries(chain);

    await countDynamicQrCodes();

    expect(chain.eq).toHaveBeenCalledWith("mode", "dynamic");
    expect(chain.neq).toHaveBeenCalledWith("status", "archived");
  });

  it("throws on a real database error", async () => {
    const chain = createChain({ data: null, error: { message: "connection failed" } });
    const { countDynamicQrCodes } = await loadQueries(chain);

    await expect(countDynamicQrCodes()).rejects.toThrow("connection failed");
  });
});

const FEEDBACK_ROW = {
  id: "fb-1",
  rating: 5,
  comment: "Great service!",
  contact: null,
  submitted_at: "2026-08-19T09:00:00.000Z",
};

describe("listQrFeedback", () => {
  it("maps every returned row to a QrFeedbackSubmission", async () => {
    const chain = createChain({ data: [FEEDBACK_ROW], error: null });
    const { listQrFeedback } = await loadQueries(chain);

    const submissions = await listQrFeedback("qr-1");

    expect(submissions).toEqual([
      {
        id: "fb-1",
        rating: 5,
        comment: "Great service!",
        contact: null,
        submittedAt: "2026-08-19T09:00:00.000Z",
      },
    ]);
  });

  it("scopes the query to the given QR code, newest first", async () => {
    const chain = createChain({ data: [], error: null });
    const { listQrFeedback } = await loadQueries(chain);

    await listQrFeedback("qr-1");

    expect(chain.eq).toHaveBeenCalledWith("qr_code_id", "qr-1");
    expect(chain.order).toHaveBeenCalledWith("submitted_at", { ascending: false });
  });

  it("throws on a real database error", async () => {
    const chain = createChain({ data: null, error: { message: "connection failed" } });
    const { listQrFeedback } = await loadQueries(chain);

    await expect(listQrFeedback("qr-1")).rejects.toThrow("connection failed");
  });
});

describe("listQrCodesPage", () => {
  it("returns the mapped items plus pagination metadata", async () => {
    const chain = createChain({ data: [ROW], error: null, count: 1 });
    const { listQrCodesPage } = await loadQueries(chain);

    const result = await listQrCodesPage();

    expect(result).toEqual({
      items: [expect.objectContaining({ id: "qr-1" })],
      totalCount: 1,
      page: 1,
      pageSize: 20,
      pageCount: 1,
    });
  });

  it("excludes archived rows by default, includes them when status=archived is requested", async () => {
    const excludeChain = createChain({ data: [], error: null, count: 0 });
    const { listQrCodesPage: list1 } = await loadQueries(excludeChain);
    await list1();
    expect(excludeChain.neq).toHaveBeenCalledWith("status", "archived");

    const includeChain = createChain({ data: [], error: null, count: 0 });
    const { listQrCodesPage: list2 } = await loadQueries(includeChain);
    await list2({ status: "archived" });
    expect(includeChain.eq).toHaveBeenCalledWith("status", "archived");
  });

  it("applies search as an escaped ilike pattern on name", async () => {
    const chain = createChain({ data: [], error: null, count: 0 });
    const { listQrCodesPage } = await loadQueries(chain);

    await listQrCodesPage({ search: "50% off_deal" });

    expect(chain.ilike).toHaveBeenCalledWith("name", "%50\\% off\\_deal%");
  });

  it("applies type and mode filters", async () => {
    const chain = createChain({ data: [], error: null, count: 0 });
    const { listQrCodesPage } = await loadQueries(chain);

    await listQrCodesPage({ qrType: "pdf", mode: "dynamic" });

    expect(chain.eq).toHaveBeenCalledWith("qr_type", "pdf");
    expect(chain.eq).toHaveBeenCalledWith("mode", "dynamic");
  });

  it("filters unfiled QR codes via folderId: 'unfiled'", async () => {
    const chain = createChain({ data: [], error: null, count: 0 });
    const { listQrCodesPage } = await loadQueries(chain);

    await listQrCodesPage({ folderId: "unfiled" });

    expect(chain.is).toHaveBeenCalledWith("folder_id", null);
  });

  it("filters to a specific folder id", async () => {
    const chain = createChain({ data: [], error: null, count: 0 });
    const { listQrCodesPage } = await loadQueries(chain);

    await listQrCodesPage({ folderId: "folder-1" });

    expect(chain.eq).toHaveBeenCalledWith("folder_id", "folder-1");
  });

  it("sorts by the requested field and direction", async () => {
    const chain = createChain({ data: [], error: null, count: 0 });
    const { listQrCodesPage } = await loadQueries(chain);

    await listQrCodesPage({ sortBy: "name", sortDirection: "asc" });

    expect(chain.order).toHaveBeenCalledWith("name", { ascending: true });
  });

  it("paginates via range, computed from page and pageSize", async () => {
    const chain = createChain({ data: [], error: null, count: 45 });
    const { listQrCodesPage } = await loadQueries(chain);

    const result = await listQrCodesPage({ page: 2, pageSize: 10 });

    expect(chain.range).toHaveBeenCalledWith(10, 19);
    expect(result.pageCount).toBe(5);
  });

  it("clamps pageSize to a sane maximum", async () => {
    const chain = createChain({ data: [], error: null, count: 0 });
    const { listQrCodesPage } = await loadQueries(chain);

    await listQrCodesPage({ pageSize: 10_000 });

    expect(chain.range).toHaveBeenCalledWith(0, 99);
  });

  it("throws on a real database error", async () => {
    const chain = createChain({ data: null, error: { message: "connection failed" } });
    const { listQrCodesPage } = await loadQueries(chain);

    await expect(listQrCodesPage()).rejects.toThrow("connection failed");
  });
});

describe("getMyQrCodeStats", () => {
  async function loadWithRpc(result: { data?: unknown; error?: unknown }) {
    const { createClient } = await import("@/lib/supabase/server");
    const rpc = vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve(result)) }));
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    return { ...(await import("@/lib/qr/queries")), rpc };
  }

  it("maps the aggregate RPC row to camelCase", async () => {
    const { getMyQrCodeStats, rpc } = await loadWithRpc({
      data: { total_count: 5, dynamic_count: 2, total_scans: 137 },
      error: null,
    });

    const stats = await getMyQrCodeStats();

    expect(stats).toEqual({ totalCount: 5, dynamicCount: 2, totalScans: 137 });
    expect(rpc).toHaveBeenCalledWith("get_my_qr_code_stats");
  });

  it("defaults to zeros when no row is returned", async () => {
    const { getMyQrCodeStats } = await loadWithRpc({ data: null, error: null });

    expect(await getMyQrCodeStats()).toEqual({ totalCount: 0, dynamicCount: 0, totalScans: 0 });
  });

  it("throws on a real database error", async () => {
    const { getMyQrCodeStats } = await loadWithRpc({
      data: null,
      error: { message: "connection failed" },
    });

    await expect(getMyQrCodeStats()).rejects.toThrow("connection failed");
  });
});
