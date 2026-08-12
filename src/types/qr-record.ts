import type { QRMode, QRType } from "./qr";

export type QRCodeStatus = "active" | "paused" | "archived";

/**
 * Display-oriented shape for a saved QR code, as shown on dashboard cards
 * and tables. A subset of the `qr_codes` row (Module 1.4) — no
 * `payload_data`/`design_config` here, since list views don't need them.
 */
export interface QRCodeSummary {
  id: string;
  name: string;
  qrType: QRType;
  mode: QRMode;
  status: QRCodeStatus;
  scanCount: number;
  updatedAt: string;
}
