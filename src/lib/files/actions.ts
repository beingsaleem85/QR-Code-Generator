"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AUTH_REQUIRED, type ActionResult } from "@/lib/qr/action-types";

/**
 * Deletes one file directly from the Files page — both the Storage object
 * and its `qr_assets` row, the same real cleanup `deleteQrCode`/
 * `syncQrAssets` already do when a QR itself is deleted or edited. If the
 * asset is still referenced by an active QR's `payload_data`, that QR's
 * landing page simply starts showing its own "not available" state
 * (every landing page already handles a missing signed URL gracefully) —
 * there's no separate "in use" guard, matching this page's existing
 * confirmation-dialog-is-the-warning pattern (Module 2.9).
 */
export async function deleteQrAsset(id: string): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: AUTH_REQUIRED };

  const { data: asset, error: fetchError } = await supabase
    .from("qr_assets")
    .select("bucket, path")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !asset) {
    return { error: "Couldn't find that file — it may already be gone." };
  }

  await supabase.storage.from(asset.bucket).remove([asset.path]);

  const { error, count } = await supabase.from("qr_assets").delete({ count: "exact" }).eq("id", id);

  if (error) {
    return { error: "Couldn't delete that file — please try again." };
  }
  if (!count) {
    return { error: "That file no longer exists, or you don't have access to it." };
  }

  revalidatePath("/dashboard/files");
  return { data: { id } };
}
