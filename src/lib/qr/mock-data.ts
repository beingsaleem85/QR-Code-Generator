import type { QRCodeSummary } from "@/types/qr-record";
import type { QrScanEvent } from "@/types/analytics";

/**
 * Phase 2 (UI) mock data — stands in for a real Supabase-backed list until
 * Module 3.5 (Saving and Managing QR Codes) wires persistence. Never
 * imported outside dashboard UI pages.
 */
export const MOCK_QR_CODES: QRCodeSummary[] = [
  {
    id: "1",
    name: "Restaurant Menu",
    qrType: "pdf",
    mode: "dynamic",
    status: "active",
    scanCount: 482,
    createdAt: "2026-06-01",
    updatedAt: "2026-08-10",
    destinationSummary: "menu-v3.pdf",
  },
  {
    id: "2",
    name: "Business Card",
    qrType: "vcard",
    mode: "static",
    status: "active",
    scanCount: 0,
    createdAt: "2026-08-05",
    updatedAt: "2026-08-05",
    destinationSummary: "Ada Lovelace, Analytical Engines Inc",
  },
  {
    id: "3",
    name: "Store Wi-Fi",
    qrType: "wifi",
    mode: "static",
    status: "active",
    scanCount: 0,
    createdAt: "2026-07-28",
    updatedAt: "2026-07-28",
    destinationSummary: "Network: Store-Guest",
  },
  {
    id: "4",
    name: "Summer Campaign",
    qrType: "url",
    mode: "dynamic",
    status: "paused",
    scanCount: 1204,
    createdAt: "2026-06-20",
    updatedAt: "2026-07-15",
    destinationSummary: "https://example.com/summer-sale",
  },
  {
    id: "5",
    name: "Old Flyer Link",
    qrType: "url",
    mode: "dynamic",
    status: "archived",
    scanCount: 39,
    createdAt: "2026-03-01",
    updatedAt: "2026-05-02",
    destinationSummary: "https://example.com/spring-event",
  },
  {
    id: "6",
    name: "Referral Program",
    qrType: "url",
    mode: "dynamic",
    status: "active",
    scanCount: 0,
    createdAt: "2026-08-11",
    updatedAt: "2026-08-11",
    destinationSummary: "https://example.com/refer",
  },
];

export function findMockQrCode(id: string): QRCodeSummary | undefined {
  return MOCK_QR_CODES.find((qrCode) => qrCode.id === id);
}

/**
 * Fixed "current time" for every date-relative analytics calculation
 * (last 24h/7d/30d, scans-over-time buckets) in the Module 2.8 demo, so the
 * numbers stay meaningful and reproducible regardless of when the app is
 * actually loaded — matches the newest `updatedAt` values above.
 */
export const MOCK_ANALYTICS_NOW = "2026-08-12T12:00:00.000Z";

/**
 * A representative sample of *recent* scan activity per dynamic QR code —
 * not a literal 1:1 replay of `scanCount` (482/1204/39 lifetime totals
 * above). Real per-event history arrives with Module 3.7; this sample only
 * needs to be large and varied enough to drive the Module 2.8 charts and
 * date-range/country/device filters realistically.
 */
const MOCK_SCAN_EVENTS: Record<string, QrScanEvent[]> = {
  // "1" — Restaurant Menu: active, steady recent traffic.
  "1": [
    {
      scannedAt: "2026-08-12T09:10:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-08-12T12:40:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "Android",
      browser: "Chrome",
    },
    {
      scannedAt: "2026-08-12T18:05:00.000Z",
      countryCode: "CA",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-08-11T11:20:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-08-11T19:50:00.000Z",
      countryCode: "US",
      deviceType: "tablet",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-08-10T08:15:00.000Z",
      countryCode: "GB",
      deviceType: "mobile",
      os: "Android",
      browser: "Chrome",
    },
    {
      scannedAt: "2026-08-10T20:30:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-08-09T13:05:00.000Z",
      countryCode: "US",
      deviceType: "desktop",
      os: "macOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-08-08T10:00:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-08-08T21:45:00.000Z",
      countryCode: "DE",
      deviceType: "mobile",
      os: "Android",
      browser: "Chrome",
    },
    {
      scannedAt: "2026-08-06T15:30:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-08-03T12:00:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "Android",
      browser: "Chrome",
    },
    {
      scannedAt: "2026-07-28T17:10:00.000Z",
      countryCode: "FR",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-07-20T09:40:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-07-15T14:25:00.000Z",
      countryCode: "US",
      deviceType: "desktop",
      os: "Windows",
      browser: "Edge",
    },
    {
      scannedAt: "2026-07-14T11:00:00.000Z",
      countryCode: "CA",
      deviceType: "mobile",
      os: "Android",
      browser: "Chrome",
    },
  ],
  // "4" — Summer Campaign: paused since 2026-07-15, so recent windows go quiet.
  "4": [
    {
      scannedAt: "2026-07-15T21:00:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-07-14T16:30:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "Android",
      browser: "Chrome",
    },
    {
      scannedAt: "2026-07-10T10:15:00.000Z",
      countryCode: "GB",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-07-08T19:00:00.000Z",
      countryCode: "US",
      deviceType: "desktop",
      os: "Windows",
      browser: "Chrome",
    },
    {
      scannedAt: "2026-07-04T12:45:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-06-29T08:30:00.000Z",
      countryCode: "AU",
      deviceType: "mobile",
      os: "Android",
      browser: "Chrome",
    },
    {
      scannedAt: "2026-06-25T14:00:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-06-22T09:20:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "Android",
      browser: "Chrome",
    },
    {
      scannedAt: "2026-06-21T17:40:00.000Z",
      countryCode: "US",
      deviceType: "desktop",
      os: "macOS",
      browser: "Safari",
    },
  ],
  // "5" — Old Flyer Link: archived, last activity well outside every filter window.
  "5": [
    {
      scannedAt: "2026-05-02T10:00:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-04-20T15:30:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "Android",
      browser: "Chrome",
    },
    {
      scannedAt: "2026-04-02T11:10:00.000Z",
      countryCode: "GB",
      deviceType: "desktop",
      os: "Windows",
      browser: "Edge",
    },
    {
      scannedAt: "2026-03-15T09:45:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
    {
      scannedAt: "2026-03-01T13:20:00.000Z",
      countryCode: "US",
      deviceType: "mobile",
      os: "Android",
      browser: "Chrome",
    },
  ],
  // "6" — Referral Program: brand new, genuinely zero scans.
  "6": [],
};

export function getMockScanEvents(id: string): QrScanEvent[] {
  return MOCK_SCAN_EVENTS[id] ?? [];
}
