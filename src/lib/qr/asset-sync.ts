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

export function extractAssetRefs(qrType: QRType, content: Record<string, unknown>): AssetRef[] {
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

function remapAssetPaths(
  qrType: QRType,
  content: Record<string, unknown>,
  pathMap: Map<string, string>,
): Record<string, unknown> {
  switch (qrType) {
    case "pdf":
    case "audio": {
      const c = content as FileFieldShape;
      if (typeof c.path === "string" && pathMap.has(c.path)) {
        return { ...content, path: pathMap.get(c.path) };
      }
      return content;
    }
    case "images": {
      const images = Array.isArray(content.images) ? content.images : [];
      return {
        ...content,
        images: images.map((image) => {
          const path = (image as FileFieldShape)?.path;
          return typeof path === "string" && pathMap.has(path)
            ? { ...image, path: pathMap.get(path) }
            : image;
        }),
      };
    }
    case "menu": {
      const items = Array.isArray(content.items) ? content.items : [];
      return {
        ...content,
        items: items.map((item) => {
          const photo = (item as MenuItemShape)?.photo;
          const path = photo?.path;
          if (typeof path === "string" && pathMap.has(path)) {
            return { ...item, photo: { ...photo, path: pathMap.get(path) } };
          }
          return item;
        }),
      };
    }
    default:
      return content;
  }
}

/**
 * Called only from `duplicateQrCode` (`src/lib/qr/actions.ts`) — makes a
 * storage-backed duplicate a genuinely independent copy instead of a second
 * `payload_data` pointer at the *same* file the original owns. Without
 * this, deleting the original would delete the underlying Storage object
 * out from under the duplicate too (an "accidental cascading loss" the
 * master build prompt's Module 3.11 explicitly calls out for Delete),
 * since only one `qr_assets` row can ever own a given `(bucket, path)`.
 *
 * Uses Storage's own `.copy()` (no download/re-upload round trip) to
 * create a new object at a fresh `{user_id}/{uuid}/{filename}` path, then
 * inserts a new `qr_assets` row for the new QR pointing at the copy.
 * Best-effort per asset: if one file's copy fails, that one asset is left
 * unduplicated (the duplicate's content still references the original's
 * path for that item) rather than the whole duplicate action failing —
 * consistent with `syncQrAssets`'s "don't let asset housekeeping block the
 * core save" precedent elsewhere in this file. Returns the `content` with
 * every successfully-copied path rewritten to its new location; the
 * caller is responsible for persisting the returned content back onto the
 * new row.
 */
export async function duplicateQrAssets(
  supabase: SupabaseClient,
  userId: string,
  newQrCodeId: string,
  qrType: QRType,
  content: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const refs = extractAssetRefs(qrType, content);
  if (refs.length === 0) return content;

  const pathMap = new Map<string, string>();
  for (const ref of refs) {
    const fileName = ref.path.split("/").pop() ?? "file";
    const newPath = `${userId}/${crypto.randomUUID()}/${fileName}`;

    const { error: copyError } = await supabase.storage.from(ref.bucket).copy(ref.path, newPath);
    if (copyError) continue;

    const { error: insertError } = await supabase.from("qr_assets").insert({
      user_id: userId,
      qr_code_id: newQrCodeId,
      asset_type: ref.assetType,
      bucket: ref.bucket,
      path: newPath,
      mime_type: ref.mimeType,
      size_bytes: ref.sizeBytes,
    });
    if (insertError) continue;

    pathMap.set(ref.path, newPath);
  }

  return pathMap.size > 0 ? remapAssetPaths(qrType, content, pathMap) : content;
}
