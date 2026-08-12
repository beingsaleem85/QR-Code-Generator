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
];

export function findMockQrCode(id: string): QRCodeSummary | undefined {
  return MOCK_QR_CODES.find((qrCode) => qrCode.id === id);
}
