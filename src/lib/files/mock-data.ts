import type { QrAsset } from "@/types/asset";

/**
 * Phase 2 (UI) mock data for the Files page — stands in for real
 * `qr_assets` rows + Supabase Storage objects until Module 3.8 wires file
 * uploads/deletes. `linkedQrCodeId` values reference `MOCK_QR_CODES`
 * (`src/lib/qr/mock-data.ts`) ids where relevant.
 */
export const MOCK_ASSETS: QrAsset[] = [
  {
    id: "a1",
    fileName: "menu-v3.pdf",
    assetType: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 842_000,
    createdAt: "2026-06-01",
    linkedQrCodeId: "1",
    uploadState: "ready",
  },
  {
    id: "a2",
    fileName: "logo-primary.png",
    assetType: "logo",
    mimeType: "image/png",
    sizeBytes: 128_000,
    createdAt: "2026-07-10",
    linkedQrCodeId: null,
    uploadState: "ready",
  },
  {
    id: "a3",
    fileName: "summer-sale-banner.jpg",
    assetType: "image",
    mimeType: "image/jpeg",
    sizeBytes: 2_100_000,
    createdAt: "2026-06-18",
    linkedQrCodeId: "4",
    uploadState: "ready",
  },
  {
    id: "a4",
    fileName: "product-catalog.pdf",
    assetType: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 5_400_000,
    createdAt: "2026-08-12",
    linkedQrCodeId: null,
    uploadState: "uploading",
  },
  {
    id: "a5",
    fileName: "corrupted-upload.pdf",
    assetType: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 12_000,
    createdAt: "2026-08-11",
    linkedQrCodeId: null,
    uploadState: "failed",
  },
];
