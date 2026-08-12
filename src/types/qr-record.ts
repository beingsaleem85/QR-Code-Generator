import type { QRMode, QRType } from "./qr";

export type QRCodeStatus = "active" | "paused" | "archived";

/**
 * Display-oriented shape for a saved QR code, as shown on dashboard cards,
 * tables, and the detail/edit pages. A subset of the `qr_codes` row
 * (Module 1.4) — no raw `payload_data`/`design_config` here, just a
 * human-readable `destinationSummary` derived from them; list views don't
 * need `createdAt`/`destinationSummary` but carrying them on every row
 * keeps this one shape usable everywhere instead of a second Detail type.
 */
export interface QRCodeSummary {
  id: string;
  name: string;
  qrType: QRType;
  mode: QRMode;
  status: QRCodeStatus;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
  destinationSummary: string;
}
