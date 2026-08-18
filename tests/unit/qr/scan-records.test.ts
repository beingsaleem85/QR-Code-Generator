import { describe, expect, it } from "vitest";
import { toQrScanEvent } from "@/lib/qr/scan-records";

describe("toQrScanEvent", () => {
  it("maps a fully-populated row", () => {
    expect(
      toQrScanEvent({
        scanned_at: "2026-08-12T09:00:00.000Z",
        country_code: "US",
        device_type: "mobile",
        os: "iOS",
        browser: "Safari",
      }),
    ).toEqual({
      scannedAt: "2026-08-12T09:00:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    });
  });

  it("keeps a null country code null rather than inventing a value", () => {
    const event = toQrScanEvent({
      scanned_at: "2026-08-12T09:00:00.000Z",
      country_code: null,
      device_type: "desktop",
      os: "Windows",
      browser: "Chrome",
    });
    expect(event.countryCode).toBeNull();
  });

  it("falls back os/browser to the literal 'Unknown' string, not null", () => {
    const event = toQrScanEvent({
      scanned_at: "2026-08-12T09:00:00.000Z",
      country_code: null,
      device_type: null,
      os: null,
      browser: null,
    });
    expect(event.os).toBe("Unknown");
    expect(event.browser).toBe("Unknown");
  });

  it("falls back an unrecognized/null device_type to 'unknown'", () => {
    expect(
      toQrScanEvent({
        scanned_at: "2026-08-12T09:00:00.000Z",
        country_code: null,
        device_type: null,
        os: null,
        browser: null,
      }).deviceType,
    ).toBe("unknown");

    expect(
      toQrScanEvent({
        scanned_at: "2026-08-12T09:00:00.000Z",
        country_code: null,
        device_type: "some-future-value",
        os: null,
        browser: null,
      }).deviceType,
    ).toBe("unknown");
  });
});
