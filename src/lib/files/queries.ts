import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { QrAsset } from "@/types/asset";

interface QrAssetDbRow {
  id: string;
  qr_code_id: string | null;
  asset_type: string;
  path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

/**
 * `qr_assets` (Module 1.4) has no `file_name` column of its own — the
 * Storage path already carries the sanitized name as its last segment
 * (`{user_id}/{asset_id}/{name}`, `src/lib/qr/asset-upload.ts`), so this
 * derives it rather than storing the same information twice.
 */
function fileNameFromPath(path: string): string {
  return path.split("/").pop() ?? path;
}

function toQrAsset(row: QrAssetDbRow): QrAsset {
  return {
    id: row.id,
    fileName: fileNameFromPath(row.path),
    assetType: row.asset_type,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    linkedQrCodeId: row.qr_code_id,
    // Real rows are only ever written once an upload has actually
    // completed (`syncQrAssets`) — there is no in-progress/failed state to
    // represent, unlike the Module 2.9 mock data this replaces.
    uploadState: "ready",
  };
}

/** RLS-scoped to the caller's own assets (`qr_assets_select_own`, Module 1.5). */
export async function listQrAssets(): Promise<QrAsset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qr_assets")
    .select("id, qr_code_id, asset_type, path, mime_type, size_bytes, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data as QrAssetDbRow[]).map(toQrAsset);
}
