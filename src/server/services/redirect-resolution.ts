import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSafeRedirectTarget } from "@/lib/qr/redirect-url";

/**
 * Contract for resolving a dynamic QR slug to its current destination.
 * Implemented for real in Module 3.6 (Dynamic QR Codes) against the
 * `resolve_qr_redirect` SECURITY DEFINER function — `qr_codes` has no
 * client-facing RLS SELECT policy, by design (see
 * supabase/migrations/20260813010001_add_table_rls_policies.sql), so this
 * must go through a privileged, narrowly-scoped path rather than a normal
 * `.from("qr_codes").select()` call.
 */
export type RedirectResolution =
  { status: "ok"; destinationUrl: string } | { status: "not_found" } | { status: "inactive" };

interface ResolveQrRedirectRow {
  destination_url: string | null;
  status: string;
}

export async function resolveDynamicQrRedirect(slug: string): Promise<RedirectResolution> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_qr_redirect", { p_slug: slug }).maybeSingle();

  const row = data as ResolveQrRedirectRow | null;
  if (error || !row || !row.destination_url) return { status: "not_found" };
  if (!isSafeRedirectTarget(row.destination_url)) return { status: "not_found" };
  if (row.status !== "active") return { status: "inactive" };

  return { status: "ok", destinationUrl: row.destination_url };
}
