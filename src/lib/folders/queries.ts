import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { QrFolder } from "@/types/folder";

interface QrFolderDbRow {
  id: string;
  name: string;
  created_at: string;
}

/** RLS-scoped (`qr_folders_select_own`) — every row already belongs to the caller. */
export async function listMyFolders(): Promise<QrFolder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qr_folders")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data as QrFolderDbRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  }));
}
