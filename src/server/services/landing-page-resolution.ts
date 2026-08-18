import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Contract for resolving a slug to a hosted landing-page experience
 * (Module 3.8 — pdf/image-gallery/audio/video; Module 3.9 will extend this
 * to social/multi-link/menu/feedback). Mirrors
 * `resolveDynamicQrRedirect`'s shape exactly, for the same reason:
 * `qr_codes` has no anon-facing SELECT policy, so resolution goes through
 * `resolve_landing_page`, a SECURITY DEFINER function analogous to
 * `resolve_qr_redirect`.
 */
export type LandingPageResolution =
  | { status: "ok"; qrType: string; payloadData: Record<string, unknown> }
  | { status: "not_found" }
  | { status: "inactive" };

interface ResolveLandingPageRow {
  qr_type: string;
  status: string;
  payload_data: Record<string, unknown> | null;
}

export async function resolveLandingPage(slug: string): Promise<LandingPageResolution> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("resolve_landing_page", { p_slug: slug })
    .maybeSingle();

  const row = data as ResolveLandingPageRow | null;
  if (error || !row) return { status: "not_found" };
  if (row.status !== "active") return { status: "inactive" };

  return { status: "ok", qrType: row.qr_type, payloadData: row.payload_data ?? {} };
}
