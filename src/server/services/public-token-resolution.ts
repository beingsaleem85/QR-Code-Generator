import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * The `/v/[token]` counterpart to `resolveLandingPage` — resolves an
 * opaque public-viewer token instead of a slug, via the `resolve_public_token`
 * SECURITY DEFINER function (same rationale as `resolve_landing_page`:
 * `qr_codes` has no anon-facing SELECT policy). `slug` is included only for
 * the caller to record analytics with (`record_qr_scan` is slug-keyed) —
 * never expose it to a client component.
 */
export type PublicTokenResolution =
  | { status: "ok"; qrType: string; payloadData: Record<string, unknown>; slug: string }
  | { status: "not_found" }
  | { status: "inactive" };

interface ResolvePublicTokenRow {
  qr_type: string;
  status: string;
  payload_data: Record<string, unknown> | null;
  slug: string | null;
}

export async function resolvePublicToken(token: string): Promise<PublicTokenResolution> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("resolve_public_token", { p_token: token })
    .maybeSingle();

  const row = data as ResolvePublicTokenRow | null;
  if (error || !row || !row.slug) return { status: "not_found" };
  if (row.status !== "active") return { status: "inactive" };

  return { status: "ok", qrType: row.qr_type, payloadData: row.payload_data ?? {}, slug: row.slug };
}
