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
 *
 * Module 3.13: now calls `resolve_qr_redirect_checked` instead of the
 * original `resolve_qr_redirect` — the combined function also runs
 * Module 3.12's rate-limit check server-side in the *same* round trip,
 * rather than `/r/[slug]` making two sequential Supabase calls on every
 * request. "Dynamic redirects must remain lightweight" is the master
 * prompt's own explicit requirement for this exact route. The original
 * `resolve_qr_redirect` function is left in place in the database
 * (unused, harmless) rather than dropped — no reason to risk a
 * destructive migration for a function that costs nothing sitting idle.
 */
export type RedirectResolution =
  | { status: "ok"; destinationUrl: string }
  | { status: "not_found" }
  | { status: "inactive" }
  | { status: "rate_limited" };

interface ResolveQrRedirectRow {
  destination_url: string | null;
  status: string | null;
  rate_limited: boolean;
}

export interface RedirectRateLimitOptions {
  key: string;
  maxPerWindow: number;
  windowSeconds: number;
}

export async function resolveDynamicQrRedirect(
  slug: string,
  rateLimit?: RedirectRateLimitOptions,
): Promise<RedirectResolution> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("resolve_qr_redirect_checked", {
      p_slug: slug,
      p_rate_limit_key: rateLimit?.key ?? null,
      p_max_per_window: rateLimit?.maxPerWindow ?? 60,
      p_window_seconds: rateLimit?.windowSeconds ?? 60,
    })
    .maybeSingle();

  const row = data as ResolveQrRedirectRow | null;
  if (error || !row) return { status: "not_found" };
  if (row.rate_limited) return { status: "rate_limited" };
  if (!row.destination_url) return { status: "not_found" };
  if (!isSafeRedirectTarget(row.destination_url)) return { status: "not_found" };
  if (row.status !== "active") return { status: "inactive" };

  return { status: "ok", destinationUrl: row.destination_url };
}
