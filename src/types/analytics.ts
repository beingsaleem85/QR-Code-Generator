export type AnalyticsDateRange = "24h" | "7d" | "30d";

export type ScanDeviceType = "mobile" | "desktop" | "tablet";

/**
 * Mirrors the columns `qr_scan_events` (Module 1.4) actually collects.
 * No visitor identifier here on purpose — the schema stores no raw IP and
 * only an optional salted `ip_hash` populated when a documented legal/
 * product need exists, so there is no reliable way to dedupe a "unique
 * scan" from a raw event stream. Do not add a `visitorId`/`isUnique`
 * field without first adding a real identifier column to back it.
 */
export interface QrScanEvent {
  scannedAt: string;
  countryCode: string;
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
