import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTH_REQUIRED } from "@/lib/qr/action-types";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockUser = { id: "user-1" };

const deleteQrCodeMock = vi.fn();
vi.mock("@/lib/qr/actions", () => ({
  deleteQrCode: (...args: unknown[]) => deleteQrCodeMock(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("bulkDeleteQrCodes", () => {
  it("requires an authenticated user", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: null } })) },
    } as never);

    const { bulkDeleteQrCodes } = await import("@/lib/qr/bulk-actions");
    const result = await bulkDeleteQrCodes(["qr-1", "qr-2"]);
    expect(result.error).toBe(AUTH_REQUIRED);
  });

  it("handles empty list without error", async () => {
    const { bulkDeleteQrCodes } = await import("@/lib/qr/bulk-actions");
    const result = await bulkDeleteQrCodes([]);
    expect(result.data).toEqual({ deletedIds: [], failedIds: [] });
  });

  it("deletes multiple QR codes and reports aggregate successes and failures", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: mockUser } })) },
    } as never);

    deleteQrCodeMock.mockImplementation(async (id: string) => {
      if (id === "qr-1") return { data: { id: "qr-1" } };
      return { error: "Failed to delete" };
    });

    const { bulkDeleteQrCodes } = await import("@/lib/qr/bulk-actions");
    const result = await bulkDeleteQrCodes(["qr-1", "qr-2"]);
    expect(result.data).toEqual({
      deletedIds: ["qr-1"],
      failedIds: ["qr-2"],
    });
    expect(deleteQrCodeMock).toHaveBeenCalledWith("qr-1");
    expect(deleteQrCodeMock).toHaveBeenCalledWith("qr-2");
  });
});

describe("bulkSetQrCodeStatus", () => {
  it("requires an authenticated user", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: null } })) },
    } as never);

    const { bulkSetQrCodeStatus } = await import("@/lib/qr/bulk-actions");
    const result = await bulkSetQrCodeStatus(["qr-1"], "paused");
    expect(result.error).toBe(AUTH_REQUIRED);
  });

  it("pauses active dynamic QRs and skips static or archived QRs", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const rows = [
      { id: "dyn-1", mode: "dynamic", status: "active" },
      { id: "dyn-paused", mode: "dynamic", status: "paused" },
      { id: "stat-1", mode: "static", status: "active" },
      { id: "arch-1", mode: "dynamic", status: "archived" },
    ];

    const updateChain = {
      in: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [{ id: "dyn-1" }], error: null })),
      })),
    };

    const selectChain = {
      in: vi.fn(() => Promise.resolve({ data: rows, error: null })),
    };

    const supabaseMock = {
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: mockUser } })) },
      from: vi.fn((table: string) => {
        if (table === "qr_codes") {
          return {
            select: vi.fn(() => selectChain),
            update: vi.fn(() => updateChain),
          };
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(supabaseMock as never);

    const { bulkSetQrCodeStatus } = await import("@/lib/qr/bulk-actions");
    const result = await bulkSetQrCodeStatus(
      ["dyn-1", "dyn-paused", "stat-1", "arch-1", "missing-id"],
      "paused",
    );

    expect(result.data).toBeDefined();
    // dyn-1 updated, dyn-paused already paused (idempotent)
    expect(result.data?.updatedIds).toContain("dyn-1");
    expect(result.data?.updatedIds).toContain("dyn-paused");
    // stat-1 skipped (static), arch-1 skipped (archived)
    expect(result.data?.skippedIds).toContain("stat-1");
    expect(result.data?.skippedIds).toContain("arch-1");
    // missing-id not found
    expect(result.data?.failedIds).toContain("missing-id");
    expect(result.data?.message).toContain("skipped");
  });
});