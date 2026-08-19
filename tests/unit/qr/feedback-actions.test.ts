import { afterEach, describe, expect, it, vi } from "vitest";

function mockSupabase(result: { error?: unknown }) {
  return { rpc: vi.fn(() => Promise.resolve(result)) };
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
  return import("@/lib/qr/feedback-actions");
}

describe("submitQrFeedback", () => {
  it("calls submit_qr_feedback with the slug and validated fields", async () => {
    const client = mockSupabase({ error: null });
    const { submitQrFeedback } = await loadActions(client);

    const result = await submitQrFeedback("abc12345", {
      rating: 5,
      comment: "Great!",
      contact: "visitor@example.com",
      consent: true,
    });

    expect(result.data).toEqual({ submitted: true });
    expect(client.rpc).toHaveBeenCalledWith("submit_qr_feedback", {
      p_slug: "abc12345",
      p_rating: 5,
      p_comment: "Great!",
      p_contact: "visitor@example.com",
    });
  });

  it("rejects a submission with no consent before ever calling the RPC", async () => {
    const client = mockSupabase({ error: null });
    const { submitQrFeedback } = await loadActions(client);

    const result = await submitQrFeedback("abc12345", { rating: 5, consent: false });

    expect(result.error).toBeTruthy();
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("passes null for omitted optional fields, never undefined-as-missing", async () => {
    const client = mockSupabase({ error: null });
    const { submitQrFeedback } = await loadActions(client);

    await submitQrFeedback("abc12345", { consent: true });

    expect(client.rpc).toHaveBeenCalledWith("submit_qr_feedback", {
      p_slug: "abc12345",
      p_rating: null,
      p_comment: null,
      p_contact: null,
    });
  });

  it("returns a clean error when the RPC call fails", async () => {
    const client = mockSupabase({ error: { message: "boom" } });
    const { submitQrFeedback } = await loadActions(client);

    const result = await submitQrFeedback("abc12345", { consent: true });

    expect(result.error).toBeTruthy();
    expect(result.data).toBeUndefined();
  });
});
