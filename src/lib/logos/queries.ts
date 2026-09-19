import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface UserLogoItem {
  id: string;
  name: string;
  path: string;
  url: string;
}

/**
 * Lists logos owned by the current authenticated user from `qr_assets`.
 * RLS enforced by `qr_assets_select_own` — never leaks across users.
 */
export async function listUserLogos(): Promise<UserLogoItem[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("qr_assets")
      .select("id, path, created_at")
      .eq("asset_type", "logo")
      .eq("bucket", "qr-logos")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    const items: UserLogoItem[] = [];
    for (const row of data) {
      const { data: signed } = await supabase.storage
        .from("qr-logos")
        .createSignedUrl(row.path, 60 * 60 * 24);
      if (signed?.signedUrl) {
        const rawFileName = row.path.split("/").pop() ?? "Logo";
        items.push({
          id: row.id,
          name: rawFileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          path: row.path,
          url: signed.signedUrl,
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}
