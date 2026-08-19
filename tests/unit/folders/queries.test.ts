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
  return import("@/lib/folders/queries");
}

describe("listMyFolders", () => {
  it("maps every row and sorts by name", async () => {
    const chain = createChain({
      data: [{ id: "folder-1", name: "Restaurants", created_at: "2026-08-01T00:00:00.000Z" }],
      error: null,
    });
    const { listMyFolders } = await loadQueries(chain);

    const folders = await listMyFolders();

    expect(folders).toEqual([
      { id: "folder-1", name: "Restaurants", createdAt: "2026-08-01T00:00:00.000Z" },
    ]);
    expect(chain.order).toHaveBeenCalledWith("name", { ascending: true });
  });

  it("throws on a real database error", async () => {
    const chain = createChain({ data: null, error: { message: "connection failed" } });
    const { listMyFolders } = await loadQueries(chain);

    await expect(listMyFolders()).rejects.toThrow("connection failed");
  });
});
