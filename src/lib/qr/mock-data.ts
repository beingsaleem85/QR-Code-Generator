import type { QRCodeSummary } from "@/types/qr-record";

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
    updatedAt: "2026-08-10",
  },
  {
    id: "2",
    name: "Business Card",
    qrType: "vcard",
    mode: "static",
    status: "active",
    scanCount: 0,
    updatedAt: "2026-08-05",
  },
  {
    id: "3",
    name: "Store Wi-Fi",
    qrType: "wifi",
    mode: "static",
    status: "active",
    scanCount: 0,
    updatedAt: "2026-07-28",
  },
  {
    id: "4",
    name: "Summer Campaign",
    qrType: "url",
    mode: "dynamic",
    status: "paused",
    scanCount: 1204,
    updatedAt: "2026-07-15",
  },
  {
    id: "5",
    name: "Old Flyer Link",
    qrType: "url",
    mode: "dynamic",
    status: "archived",
    scanCount: 39,
    updatedAt: "2026-05-02",
  },
];
