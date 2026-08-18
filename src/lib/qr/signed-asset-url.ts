import "server-only";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Generates a time-limited signed URL for a private Storage object, called
 * from the public `/p/[slug]` landing page for an anonymous visitor. Works
 * with the plain anon-key server client — no service-role key — because
 * `storage.objects` carries an additional RLS policy (Module 3.8's
 * `*_public_read_active` policies) granting `anon`/`authenticated` read
 * access specifically to files belonging to an active, dynamic QR. Pausing
 * or archiving the QR revokes this immediately, since the policy itself
 * re-checks status on every call — nothing here needs to duplicate that
 * check. Returns `null` (never throws) if signing fails for any reason —
 * callers treat that as "this asset isn't available," not a hard error.
 */
export async function createSignedAssetUrl(bucket: string, path: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
