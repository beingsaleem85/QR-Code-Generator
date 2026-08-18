import { afterEach, describe, expect, it, vi } from "vitest";

function createChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    order: vi.fn(() => chain),
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
  return import("@/lib/files/queries");
}

const ROW = {
  id: "asset-1",
  qr_code_id: "qr-1",
  asset_type: "pdf_document",
  path: "user-1/asset-1/menu.pdf",
  mime_type: "application/pdf",
  size_bytes: 1000,
  created_at: "2026-08-01T00:00:00.000Z",
};

describe("listQrAssets", () => {
  it("maps every row, deriving fileName from the storage path", async () => {
    const chain = createChain({ data: [ROW], error: null });
    const { listQrAssets } = await loadQueries(chain);

    const assets = await listQrAssets();

    expect(assets).toEqual([
      {
        id: "asset-1",
        fileName: "menu.pdf",
        assetType: "pdf_document",
        mimeType: "application/pdf",
        sizeBytes: 1000,
        createdAt: "2026-08-01T00:00:00.000Z",
        linkedQrCodeId: "qr-1",
        uploadState: "ready",
      },
    ]);
  });

  it("maps a null qr_code_id to an unlinked asset", async () => {
    const chain = createChain({ data: [{ ...ROW, qr_code_id: null }], error: null });
    const { listQrAssets } = await loadQueries(chain);

    expect((await listQrAssets())[0].linkedQrCodeId).toBeNull();
  });

  it("throws on a real database error", async () => {
    const chain = createChain({ data: null, error: { message: "connection failed" } });
    const { listQrAssets } = await loadQueries(chain);

    await expect(listQrAssets()).rejects.toThrow("connection failed");
  });
});
