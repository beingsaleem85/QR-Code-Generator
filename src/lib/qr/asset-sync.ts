import type { SupabaseClient } from "@supabase/supabase-js";
import type { QRType } from "@/types/qr";

interface AssetRef {
  assetType: string;
  bucket: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
}

interface FileFieldShape {
  path?: unknown;
  mimeType?: unknown;
  sizeBytes?: unknown;
}

function singleFileAsset(
  assetType: string,
  bucket: string,
  content: Record<string, unknown>,
): AssetRef[] {
  const c = content as FileFieldShape;
  if (typeof c.path !== "string" || !c.path) return [];
  return [
    {
      assetType,
      bucket,
      path: c.path,
      mimeType: typeof c.mimeType === "string" ? c.mimeType : "application/octet-stream",
      sizeBytes: typeof c.sizeBytes === "number" ? c.sizeBytes : 0,
    },
  ];
}

/**
 * The set of Storage-backed assets a QR type's saved `content` references —
 * one file for pdf/audio, an ordered list for a gallery. Only types with
 * `needsStorage: true` (Module 1.3 registry) ever return anything.
 */
function galleryAssets(content: Record<string, unknown>): AssetRef[] {
  const images = Array.isArray(content.images) ? content.images : [];
  return images
    .filter(
      (image): image is FileFieldShape =>
        !!image && typeof image === "object" && typeof (image as FileFieldShape).path === "string",
    )
    .map((image) => ({
      assetType: "gallery_image",
      bucket: "qr-gallery",
      path: image.path as string,
      mimeType: typeof image.mimeType === "string" ? image.mimeType : "application/octet-stream",
      sizeBytes: typeof image.sizeBytes === "number" ? image.sizeBytes : 0,
    }));
}

interface MenuItemShape {
  photo?: FileFieldShape;
}

/** One optional photo per menu item, keyed the same way `galleryAssets` handles an image array. */
function menuAssets(content: Record<string, unknown>): AssetRef[] {
  const items = Array.isArray(content.items) ? content.items : [];
  return items
    .map((item) => (item as MenuItemShape).photo)
    .filter(
      (photo): photo is FileFieldShape =>
        !!photo && typeof photo === "object" && typeof photo.path === "string",
    )
    .map((photo) => ({
      assetType: "menu_item_photo",
      bucket: "qr-gallery",
      path: photo.path as string,
      mimeType: typeof photo.mimeType === "string" ? photo.mimeType : "application/octet-stream",
      sizeBytes: typeof photo.sizeBytes === "number" ? photo.sizeBytes : 0,
    }));
}

function extractAssetRefs(qrType: QRType, content: Record<string, unknown>): AssetRef[] {
  switch (qrType) {
    case "pdf":
      return singleFileAsset("pdf_document", "qr-documents", content);
    case "images":
      return galleryAssets(content);
    case "audio":
      return singleFileAsset("audio_track", "qr-media", content);
    case "menu":
      return menuAssets(content);
    default:
      return [];
  }
}

/**
 * Keeps `qr_assets` (Module 1.4) in sync with whatever files a QR's saved
 * `content` currently references — called after every successful
 * save/update of a QR whose type needs Storage. Runs with the caller's own
 * (owner's) session, the same one that already has full CRUD on its own
 * `qr_assets` rows and Storage objects (Module 1.5) — no privileged access
 * needed for any of this.
 *
 * Deliberately simple rather than a careful diff: every asset referenced
 * by the new content is upserted (by its unique `(bucket, path)`), and
 * every existing `qr_assets` row for this QR that ISN'T referenced by the
 * new content is deleted — both the metadata row and the underlying
 * Storage object, so replacing a file doesn't leave the old one behind
 * forever. A QR with a single file (pdf/audio) or a short image gallery
 * never has enough rows for this to be a meaningful cost.
 */
export async function syncQrAssets(
  supabase: SupabaseClient,
  userId: string,
  qrCodeId: string,
  qrType: QRType,
  content: Record<string, unknown>,
): Promise<void> {
  const refs = extractAssetRefs(qrType, content);
  const keepPaths = new Set(refs.map((ref) => ref.path));

  const { data: existing } = await supabase
    .from("qr_assets")
    .select("id, bucket, path")
    .eq("qr_code_id", qrCodeId);

  const stale = ((existing as { id: string; bucket: string; path: string }[] | null) ?? []).filter(
    (row) => !keepPaths.has(row.path),
  );

  for (const row of stale) {
    await supabase.storage.from(row.bucket).remove([row.path]);
  }
  if (stale.length > 0) {
    await supabase
      .from("qr_assets")
      .delete()
      .in(
        "id",
        stale.map((row) => row.id),
      );
  }

  if (refs.length > 0) {
    await supabase.from("qr_assets").upsert(
      refs.map((ref) => ({
        user_id: userId,
        qr_code_id: qrCodeId,
        asset_type: ref.assetType,
        bucket: ref.bucket,
        path: ref.path,
        mime_type: ref.mimeType,
        size_bytes: ref.sizeBytes,
      })),
      { onConflict: "bucket,path" },
    );
  }
}
