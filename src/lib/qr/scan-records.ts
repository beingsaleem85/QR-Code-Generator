import type { QrScanEvent, ScanDeviceType } from "@/types/analytics";

/** Raw `qr_scan_events` row shape (snake_case, as returned by supabase-js). */
export interface QrScanEventDbRow {
  scanned_at: string;
  country_code: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
}

const VALID_DEVICE_TYPES: ReadonlySet<string> = new Set(["mobile", "desktop", "tablet", "unknown"]);

function toDeviceType(value: string | null): ScanDeviceType {
  return value && VALID_DEVICE_TYPES.has(value) ? (value as ScanDeviceType) : "unknown";
}

export function toQrScanEvent(row: QrScanEventDbRow): QrScanEvent {
  return {
    scannedAt: row.scanned_at,
    countryCode: row.country_code,
    deviceType: toDeviceType(row.device_type),
    os: row.os ?? "Unknown",
    browser: row.browser ?? "Unknown",
  };
}
