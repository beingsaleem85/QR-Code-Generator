import "server-only";
import { createClient } from "@/lib/supabase/server";
import { parseUserAgent } from "@/lib/qr/user-agent";

export interface ScanMetadata {
  referrer: string | null;
  /** Raw User-Agent header — parsed into device/OS/browser here, not by the caller. */
  userAgent: string | null;
  /** A platform-provided edge geo header value (e.g. Vercel's/Cloudflare's
   * country header), if the caller found one — never a geo-IP lookup. */
  countryCode: string | null;
}

/**
 * Records one scan against a dynamic QR via the `record_qr_scan` SECURITY
 * DEFINER function (same privileged-path rationale as
 * `resolveDynamicQrRedirect`). Device/OS/browser are parsed from the raw
 * User-Agent here (Module 3.7, `parseUserAgent`) rather than by the route
 * handler, keeping User-Agent parsing in one place. Never throws: a
 * scan-recording failure must never surface to (or block) the visitor being
 * redirected, so callers can fire this without a try/catch.
 */
export async function recordQrScan(slug: string, metadata: ScanMetadata): Promise<void> {
  try {
    const { deviceType, os, browser } = parseUserAgent(metadata.userAgent);
    const supabase = await createClient();
    await supabase.rpc("record_qr_scan", {
      p_slug: slug,
      p_device_type: deviceType,
      p_os: os,
      p_browser: browser,
      p_referrer: metadata.referrer,
      p_country_code: metadata.countryCode,
    });
  } catch {
    // Best-effort — see function doc comment above.
  }
}
