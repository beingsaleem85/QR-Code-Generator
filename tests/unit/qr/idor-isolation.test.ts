import { afterEach, describe, expect, it, vi } from "vitest";
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
    gte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    range: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
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

async function loadActions(supabaseClient: unknown) {
  const { createClient } = await import("@/lib/supabase/server");
  vi.mocked(createClient).mockResolvedValue(supabaseClient as never);
  return import("@/lib/qr/actions");
}

async function loadFolderActions(supabaseClient: unknown) {
  const { createClient } = await import("@/lib/supabase/server");
  vi.mocked(createClient).mockResolvedValue(supabaseClient as never);
  return import("@/lib/folders/actions");
}

const SAMPLE_INPUT = {
  name: "Updated Name",
  mode: "static" as const,
  qrType: "url" as const,
  content: { url: "https://example.com" },
  design: DEFAULT_DESIGN_CONFIG,
};

describe("Strict Cross-Account Isolation (IDOR Protection)", () => {
  const USER_B_ID = "user-b-2222-2222-222222222222";
  const USER_A_QR_ID = "qr-a-3333-3333-333333333333";
  const USER_A_FOLDER_ID = "folder-a-4444-4444-444444444444";

  it("prevents User B from updating User A's QR code", async () => {
    // When User B queries for User A's QR with eq('user_id', USER_B_ID), it returns null
    const selectChain = createChain({ data: null });
    const fromMock = vi.fn().mockReturnValue(selectChain);

    const supabase = {
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: USER_B_ID } } })) },
      from: fromMock,
      storage: { from: vi.fn() },
    };

    const { updateQrCode } = await loadActions(supabase);
    const result = await updateQrCode(USER_A_QR_ID, SAMPLE_INPUT);

    expect(result.error).toMatch(/Couldn't find that QR code/i);
    expect(selectChain.eq).toHaveBeenCalledWith("id", USER_A_QR_ID);
    expect(selectChain.eq).toHaveBeenCalledWith("user_id", USER_B_ID);
  });

  it("prevents User B from duplicating User A's QR code", async () => {
    const selectChain = createChain({ data: null });
    const fromMock = vi.fn().mockReturnValue(selectChain);

    const supabase = {
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: USER_B_ID } } })) },
      from: fromMock,
      storage: { from: vi.fn() },
    };

    const { duplicateQrCode } = await loadActions(supabase);
    const result = await duplicateQrCode(USER_A_QR_ID);

    expect(result.error).toMatch(/Couldn't find that QR code to duplicate/i);
    expect(selectChain.eq).toHaveBeenCalledWith("id", USER_A_QR_ID);
    expect(selectChain.eq).toHaveBeenCalledWith("user_id", USER_B_ID);
  });

  it("prevents User B from deleting User A's QR code", async () => {
    const selectChain = createChain({ data: null });
    const fromMock = vi.fn().mockReturnValue(selectChain);

    const supabase = {
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: USER_B_ID } } })) },
      from: fromMock,
      storage: { from: vi.fn() },
    };

    const { deleteQrCode } = await loadActions(supabase);
    const result = await deleteQrCode(USER_A_QR_ID);

    expect(result.error).toMatch(/That QR code no longer exists, or you don't have access/i);
    expect(selectChain.eq).toHaveBeenCalledWith("id", USER_A_QR_ID);
    expect(selectChain.eq).toHaveBeenCalledWith("user_id", USER_B_ID);
  });

  it("prevents User B from pausing or resuming User A's QR code", async () => {
    const updateChain = createChain({ data: null, error: { message: "No row updated" } });
    const fromMock = vi.fn().mockReturnValue(updateChain);

    const supabase = {
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: USER_B_ID } } })) },
      from: fromMock,
      storage: { from: vi.fn() },
    };

    const { setQrCodeStatus } = await loadActions(supabase);
    const result = await setQrCodeStatus(USER_A_QR_ID, "paused");

    expect(result.error).toMatch(/Couldn't update status/i);
    expect(updateChain.eq).toHaveBeenCalledWith("id", USER_A_QR_ID);
    expect(updateChain.eq).toHaveBeenCalledWith("user_id", USER_B_ID);
  });

  it("prevents User B from moving User A's QR code to a folder", async () => {
    const updateChain = createChain({ data: null, error: { message: "No row updated" } });
    const fromMock = vi.fn().mockReturnValue(updateChain);

    const supabase = {
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: USER_B_ID } } })) },
      from: fromMock,
    };

    const { assignQrCodeFolder } = await loadFolderActions(supabase);
    const result = await assignQrCodeFolder(USER_A_QR_ID, "folder-id");

    expect(result.error).toMatch(/Couldn't move that QR code/i);
    expect(updateChain.eq).toHaveBeenCalledWith("id", USER_A_QR_ID);
    expect(updateChain.eq).toHaveBeenCalledWith("user_id", USER_B_ID);
  });

  it("prevents User B from deleting User A's folder", async () => {
    const deleteChain = createChain({ count: 0 });
    const fromMock = vi.fn().mockReturnValue(deleteChain);

    const supabase = {
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: USER_B_ID } } })) },
      from: fromMock,
    };

    const { deleteFolder } = await loadFolderActions(supabase);
    const result = await deleteFolder(USER_A_FOLDER_ID);

    expect(result.error).toMatch(/That folder no longer exists, or you don't have access/i);
    expect(deleteChain.eq).toHaveBeenCalledWith("id", USER_A_FOLDER_ID);
    expect(deleteChain.eq).toHaveBeenCalledWith("user_id", USER_B_ID);
  });

  it("returns null when User B queries User A's QR code detail (getQrCodeById)", async () => {
    // Under RLS, querying another user's row yields no matching rows (data: null)
    const selectChain = createChain({ data: null });
    const fromMock = vi.fn().mockReturnValue(selectChain);

    const supabase = {
      from: fromMock,
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: () => Promise.resolve(supabase),
    }));

    const { getQrCodeById } = await import("@/lib/qr/queries");
    const result = await getQrCodeById(USER_A_QR_ID);

    expect(result).toBeNull();
    expect(fromMock).toHaveBeenCalledWith("qr_codes");
    expect(selectChain.eq).toHaveBeenCalledWith("id", USER_A_QR_ID);
  });

  it("returns empty results when User B queries User A's feedback submissions", async () => {
    // Under RLS, subquery joins on qr_codes.user_id = auth.uid() return 0 rows for User B
    const selectChain = createChain({ data: [] });
    const fromMock = vi.fn().mockReturnValue(selectChain);

    const supabase = {
      from: fromMock,
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: () => Promise.resolve(supabase),
    }));

    const { listQrFeedback } = await import("@/lib/qr/queries");
    const result = await listQrFeedback(USER_A_QR_ID);

    expect(result).toEqual([]);
    expect(fromMock).toHaveBeenCalledWith("qr_feedback_submissions");
    expect(selectChain.eq).toHaveBeenCalledWith("qr_code_id", USER_A_QR_ID);
  });

  it("returns empty results when User B queries User A's scan events", async () => {
    // Under RLS, qr_scan_events joined with qr_codes.user_id = auth.uid() return 0 rows for User B
    const selectChain = createChain({ data: [] });
    const fromMock = vi.fn().mockReturnValue(selectChain);

    const supabase = {
      from: fromMock,
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: () => Promise.resolve(supabase),
    }));

    const { listScanEvents } = await import("@/lib/qr/queries");
    const result = await listScanEvents(USER_A_QR_ID);

    expect(result).toEqual([]);
    expect(fromMock).toHaveBeenCalledWith("qr_scan_events");
    expect(selectChain.eq).toHaveBeenCalledWith("qr_code_id", USER_A_QR_ID);
  });
});
