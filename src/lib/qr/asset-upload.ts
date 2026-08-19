"use client";

import { createClient } from "@/lib/supabase/client";
import { slugifyForFilename } from "@/lib/qr/render";

/**
 * Mirrors the bucket constraints already configured in Supabase Storage
 * itself (Module 1.5's `file_size_limit`/`allowed_mime_types` on each
 * bucket) — duplicated here only for immediate client-side feedback before
 * even attempting an upload. The bucket's own configuration is the real,
 * server-enforced boundary; a client bypassing this check would still be
 * rejected by Storage itself, never by trusting this alone.
 */
export const ASSET_BUCKETS = {
  pdf: {
    bucket: "qr-documents",
    maxSizeBytes: 20 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
  },
  gallery: {
    bucket: "qr-gallery",
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  },
  audio: {
    bucket: "qr-media",
    maxSizeBytes: 15 * 1024 * 1024,
    allowedMimeTypes: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg"],
  },
  menu: {
    // Menu item photos are images like a gallery image — reuses the same
    // bucket (and its Module 3.8 public-read policy) rather than
    // provisioning a dedicated bucket for a single field on one QR type.
    bucket: "qr-gallery",
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  },
} as const;

export type AssetKind = keyof typeof ASSET_BUCKETS;

export interface UploadedAsset {
  path: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
}

export class AssetValidationError extends Error {}

function validateFile(kind: AssetKind, file: File): void {
  const config = ASSET_BUCKETS[kind];
  if (!(config.allowedMimeTypes as readonly string[]).includes(file.type)) {
    throw new AssetValidationError(`"${file.name}" isn't a supported file type.`);
  }
  if (file.size > config.maxSizeBytes) {
    throw new AssetValidationError(
      `"${file.name}" is too large (max ${Math.round(config.maxSizeBytes / (1024 * 1024))}MB).`,
    );
  }
}

function fileExtension(fileName: string): string {
  const match = /\.[a-zA-Z0-9]+$/.exec(fileName);
  return match ? match[0].toLowerCase() : "";
}

/**
 * Uploads directly from the browser to Storage using the signed-in user's
 * own session — the owner-only RLS policies from Module 1.5 already permit
 * this, no server round-trip or privileged key needed. Path convention
 * (`{user_id}/{asset_id}/{filename}`) matches what those policies check
 * against (`storage.foldername(name))[1] = auth.uid()`).
 */
export async function uploadQrAsset(kind: AssetKind, file: File): Promise<UploadedAsset> {
  validateFile(kind, file);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new AssetValidationError("You must be signed in to upload a file.");
  }

  const assetId = crypto.randomUUID();
  const baseName = slugifyForFilename(file.name.replace(/\.[^./]+$/, ""), "file");
  const path = `${user.id}/${assetId}/${baseName}${fileExtension(file.name)}`;

  const { bucket } = ASSET_BUCKETS[kind];
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);

  return { path, fileName: file.name, sizeBytes: file.size, mimeType: file.type };
}
