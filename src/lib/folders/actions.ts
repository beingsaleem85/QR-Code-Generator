"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AUTH_REQUIRED, type ActionResult } from "@/lib/qr/action-types";
import { MAX_FOLDER_NAME_LENGTH } from "@/types/folder";

const UNIQUE_VIOLATION = "23505";

async function requireUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function revalidateQrListPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/qr-codes");
}

export async function createFolder(name: string): Promise<ActionResult<{ id: string }>> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Give the folder a name." };
  if (trimmed.length > MAX_FOLDER_NAME_LENGTH) {
    return { error: `Folder name must be ${MAX_FOLDER_NAME_LENGTH} characters or fewer.` };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return { error: AUTH_REQUIRED };

  const { data, error } = await supabase
    .from("qr_folders")
    .insert({ user_id: user.id, name: trimmed })
    .select("id")
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: `You already have a folder named "${trimmed}".` };
    }
    return { error: "Couldn't create the folder — please try again." };
  }

  revalidateQrListPaths();
  return { data: { id: data.id } };
}

/**
 * `qr_codes.folder_id` is `ON DELETE SET NULL` (Module 1.4) — any QR codes
 * in this folder become unfiled automatically, never deleted alongside it.
 */
export async function deleteFolder(id: string): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return { error: AUTH_REQUIRED };

  const { error, count } = await supabase
    .from("qr_folders")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    return { error: "Couldn't delete the folder — please try again." };
  }
  if (!count) {
    return { error: "That folder no longer exists, or you don't have access to it." };
  }

  revalidateQrListPaths();
  return { data: { id } };
}

export async function assignQrCodeFolder(
  qrCodeId: string,
  folderId: string | null,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return { error: AUTH_REQUIRED };

  const { data, error } = await supabase
    .from("qr_codes")
    .update({ folder_id: folderId })
    .eq("id", qrCodeId)
    .select("id")
    .single();

  if (error) {
    return {
      error: "Couldn't move that QR code — it may have been deleted, or you may not have access.",
    };
  }

  revalidateQrListPaths();
  return { data: { id: data.id } };
}
