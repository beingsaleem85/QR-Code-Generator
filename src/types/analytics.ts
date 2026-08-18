export type AnalyticsDateRange = "24h" | "7d" | "30d";

export type ScanDeviceType = "mobile" | "desktop" | "tablet" | "unknown";

/**
 * Mirrors the columns `qr_scan_events` (Module 1.4) actually collects.
 * No visitor identifier here on purpose — the schema stores no raw IP and
 * only an optional salted `ip_hash` populated when a documented legal/
 * product need exists, so there is no reliable way to dedupe a "unique
 * scan" from a raw event stream. Do not add a `visitorId`/`isUnique`
 * field without first adding a real identifier column to back it.
 *
 * `countryCode` is nullable (Module 3.7): it's only ever populated from a
 * platform-provided edge header (Vercel/Cloudflare), never from a paid
 * geo-IP lookup — so on hosting without one, it's genuinely not collected
 * rather than guessed. `os`/`browser` fall back to the literal string
 * `"Unknown"` (not null) when User-Agent parsing can't classify them, since
 * that's realistically rare and keeps `countByField`'s generic
 * `String(event[field])` grouping correct without special-casing null.
 */
export interface QrScanEvent {
  scannedAt: string;
  countryCode: string | null;
  deviceType: ScanDeviceType;
  os: string;
  browser: string;
}

export interface DistributionEntry {
  label: string;
  count: number;
  percentage: number;
}

export interface DayCount {
  date: string;
  count: number;
}
