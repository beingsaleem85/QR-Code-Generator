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

const CHROME_WINDOWS_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

describe("recordQrScan", () => {
  it("parses the User-Agent and calls record_qr_scan with all metadata", async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const { recordQrScan } = await loadScanTracking({ rpc });

    await recordQrScan("abc12345", {
      referrer: "https://google.com",
      userAgent: CHROME_WINDOWS_UA,
      countryCode: "US",
    });

    expect(rpc).toHaveBeenCalledWith("record_qr_scan", {
      p_slug: "abc12345",
      p_device_type: "desktop",
      p_os: "Windows",
      p_browser: "Chrome",
      p_referrer: "https://google.com",
      p_country_code: "US",
    });
  });

  it("passes null metadata through as-is when nothing was collected", async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const { recordQrScan } = await loadScanTracking({ rpc });

    await recordQrScan("abc12345", { referrer: null, userAgent: null, countryCode: null });

    expect(rpc).toHaveBeenCalledWith("record_qr_scan", {
      p_slug: "abc12345",
      p_device_type: "unknown",
      p_os: null,
      p_browser: null,
      p_referrer: null,
      p_country_code: null,
    });
  });

  it("never throws, even when the RPC call itself throws", async () => {
    const rpc = vi.fn(() => Promise.reject(new Error("network error")));
    const { recordQrScan } = await loadScanTracking({ rpc });

    await expect(
      recordQrScan("abc12345", { referrer: null, userAgent: null, countryCode: null }),
    ).resolves.toBeUndefined();
  });

  it("never throws when createClient itself rejects", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockRejectedValue(new Error("no cookies context"));
    const { recordQrScan } = await import("@/lib/qr/scan-tracking");

    await expect(
      recordQrScan("abc12345", { referrer: null, userAgent: null, countryCode: null }),
    ).resolves.toBeUndefined();
  });
});
