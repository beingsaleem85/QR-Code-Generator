import "server-only";
import { createClient } from "@supabase/supabase-js";
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
 * `resolveDynamicQrRedirect`), granted to `anon` — it never needs the
 * visitor's session, so this uses a bare anon-key client instead of
 * `@/lib/supabase/server`'s cookie-bound one deliberately: this is always
 * called from inside `after()`, and `after()` callbacks in a Server
 * Component (unlike Route Handlers) throw if they touch `cookies()` — which
 * `@/lib/supabase/server`'s `createClient()` does internally. Device/OS/
 * browser are parsed from the raw User-Agent here (Module 3.7,
 * `parseUserAgent`) rather than by the route handler, keeping User-Agent
 * parsing in one place. Never throws: a scan-recording failure must never
 * surface to (or block) the visitor being redirected, so callers can fire
 * this without a try/catch.
 */
export async function recordQrScan(slug: string, metadata: ScanMetadata): Promise<void> {
  try {
    const { deviceType, os, browser } = parseUserAgent(metadata.userAgent);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
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
