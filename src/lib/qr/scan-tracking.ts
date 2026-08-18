import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Records one scan against a dynamic QR via the `record_qr_scan` SECURITY
 * DEFINER function (same privileged-path rationale as
 * `resolveDynamicQrRedirect`). Only `referrer` is captured for now — real
 * device/OS/browser parsing from the User-Agent header is Module 3.7's job
 * ("Scan Analytics"); the function signature already accepts them so 3.7
 * only has to start passing values, not touch this plumbing again. Never
 * throws: a scan-recording failure must never surface to (or block) the
 * visitor being redirected, so callers can fire this without a try/catch.
 */
export async function recordQrScan(slug: string, referrer: string | null): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("record_qr_scan", {
      p_slug: slug,
      p_referrer: referrer,
    });
  } catch {
    // Best-effort — see module doc comment above.
  }
}
