"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/account/profile";
import { AUTH_REQUIRED, type ActionResult } from "@/lib/qr/action-types";

/**
 * Persists the signed-in user's display name to their `profiles` row.
 * `profiles_update_own` (RLS) already restricts this to the caller's own
 * row — `auth.getUser()` here is what makes that ownership real (no
 * client-supplied user id anywhere), matching every other mutation in this
 * app (`saveQrCode`, etc.). Never touches `account_entitlements` — there is
 * no path from this action to `plan`/`is_lifetime`/`dynamic_qr_limit`.
 */
export async function updateDisplayName(
  displayName: string,
): Promise<ActionResult<{ displayName: string }>> {
  const parsed = profileSchema.safeParse({ displayName });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid display name." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: AUTH_REQUIRED };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);

  if (error) {
    return { error: "Couldn't save your changes — please try again." };
  }

  revalidatePath("/dashboard/account");
  return { data: { displayName: parsed.data.displayName } };
}
