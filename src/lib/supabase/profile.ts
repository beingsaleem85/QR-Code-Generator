import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Creates the `profiles` row for a user if it doesn't already exist. Only
 * `id` is written — `display_name`/`avatar_url` stay null until the user
 * sets them, so this is safe to call idempotently on every sign-in, not
 * just once at signup (accounts created before this logic existed still
 * get a row on their next login).
 */
export async function ensureProfile(supabase: SupabaseClient, user: User) {
  await supabase
    .from("profiles")
    .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
}
