import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Same "whichever edge platform provides it" approach as
 * `src/app/r/[slug]/route.ts`'s own `readEdgeCountryCode` (Module 3.7) —
 * `x-forwarded-for` (Vercel and most reverse proxies; may be a
 * comma-separated chain, the first entry is the original client) falling
 * back to `x-real-ip`. `null` when neither header is present (local dev,
 * or a platform that sets neither) — callers must treat that as "skip
 * rate limiting for this request" rather than lumping every such request
 * into one shared bucket, which would be a self-inflicted denial of
 * service the moment this app is deployed somewhere that doesn't set
 * either header.
 */
export function readClientIp(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip");
}

export interface RateLimitConfig {
  maxPerWindow: number;
  windowSeconds: number;
}

/**
 * Wraps the `check_rate_limit` RPC (`supabase/migrations/20260821090000_
 * add_rate_limiting.sql`). Fails **open** (allows the request) on any
 * error reaching the limiter itself — a broken rate limiter must never
 * become a way to take down the redirect or feedback path it's supposed
 * to be protecting; the cost of occasionally under-limiting during an
 * outage is far lower than the cost of a self-inflicted outage.
 */
export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_max_per_window: config.maxPerWindow,
      p_window_seconds: config.windowSeconds,
    });
    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}
