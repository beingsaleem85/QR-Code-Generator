import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

async function loadScanTracking(supabaseClient: unknown) {
  const { createClient } = await import("@/lib/supabase/server");
  vi.mocked(createClient).mockResolvedValue(supabaseClient as never);
  return import("@/lib/qr/scan-tracking");
}

describe("recordQrScan", () => {
  it("calls record_qr_scan with the slug and referrer", async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const { recordQrScan } = await loadScanTracking({ rpc });

    await recordQrScan("abc12345", "https://google.com");

    expect(rpc).toHaveBeenCalledWith("record_qr_scan", {
      p_slug: "abc12345",
      p_referrer: "https://google.com",
    });
  });

  it("passes a null referrer through as-is", async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const { recordQrScan } = await loadScanTracking({ rpc });

    await recordQrScan("abc12345", null);

    expect(rpc).toHaveBeenCalledWith("record_qr_scan", {
      p_slug: "abc12345",
      p_referrer: null,
    });
  });

  it("never throws, even when the RPC call itself throws", async () => {
    const rpc = vi.fn(() => Promise.reject(new Error("network error")));
    const { recordQrScan } = await loadScanTracking({ rpc });

    await expect(recordQrScan("abc12345", null)).resolves.toBeUndefined();
  });

  it("never throws when createClient itself rejects", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockRejectedValue(new Error("no cookies context"));
    const { recordQrScan } = await import("@/lib/qr/scan-tracking");

    await expect(recordQrScan("abc12345", null)).resolves.toBeUndefined();
  });
});
