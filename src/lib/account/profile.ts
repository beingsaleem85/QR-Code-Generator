import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/dal";
import type { UserProfile } from "@/types/account";

interface ProfileDbRow {
  display_name: string | null;
  avatar_url: string | null;
}

/**
 * The signed-in user's real profile: email comes from Supabase Auth
 * (`auth.users`, never itself stored in `profiles`), display name/avatar
 * come from their `profiles` row. `getAuthenticatedUser()` already
 * redirects to `/login` if there's no real session — every dashboard page
 * (including this one, via the `(dashboard)` layout) only ever renders for
 * a genuinely authenticated account, so this never falls back to mock or
 * placeholder data. A missing `profiles` row (shouldn't normally happen —
 * `ensureProfile` upserts one on every sign-in) is treated the same as an
 * unset display name, not an error.
 */
export async function getMyProfile(): Promise<UserProfile> {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const row = data as ProfileDbRow | null;
  return {
    email: user.email ?? "",
    displayName: row?.display_name ?? null,
    avatarUrl: row?.avatar_url ?? null,
  };
}

/**
 * What to show wherever a name is expected (header, avatar initials) when
 * the user hasn't set a display name yet — falls back to the email's
 * local-part rather than showing nothing, without rendering the full email
 * address somewhere a name belongs.
 */
export function resolveDisplayLabel(profile: Pick<UserProfile, "displayName" | "email">): string {
  const trimmed = profile.displayName?.trim();
  if (trimmed) return trimmed;
  return profile.email.split("@")[0] || "Your account";
}
