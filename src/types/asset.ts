export type AssetUploadState = "ready" | "uploading" | "failed";

/**
 * Display-oriented shape for an uploaded file, mirroring the `qr_assets`
 * columns (Module 1.4) that matter to this UI. `linkedQrCodeId` is nullable
 * because an asset (e.g. a shared logo) doesn't have to belong to one QR
 * code — matches `qr_assets.qr_code_id` being nullable with `on delete set
 * null`.
 */
export interface QrAsset {
  id: string;
  fileName: string;
  assetType: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  linkedQrCodeId: string | null;
  uploadState: AssetUploadState;
}
