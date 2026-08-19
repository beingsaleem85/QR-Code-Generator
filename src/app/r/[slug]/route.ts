import { NextResponse, after } from "next/server";
import { resolveDynamicQrRedirect } from "@/server/services/redirect-resolution";
import { recordQrScan } from "@/lib/qr/scan-tracking";
import { readClientIp } from "@/lib/rate-limit";
import { readEdgeCountryCode } from "@/lib/qr/edge-headers";

/**
 * Module 3.12: per-IP redirect-abuse protection — generous enough that a
 * real visitor rapidly re-scanning/retrying never notices it, tight enough
 * to blunt a scripted flood. Also the scan-event-flood protection the
 * master prompt separately names: a scan is recorded on this exact same
 * request, so limiting requests here limits scan floods for free, no
 * second mechanism needed.
 *
 * Module 3.13: checked *inside* `resolveDynamicQrRedirect`'s own RPC call
 * now (`resolve_qr_redirect_checked`), not as a separate `checkRateLimit`
 * call beforehand — one Supabase round trip does both jobs instead of two,
 * on the single most latency-sensitive path in this app.
 */
const REDIRECT_RATE_LIMIT = { maxPerWindow: 60, windowSeconds: 60 };

/**
 * Module 3.11: a paused/missing dynamic QR must show "a controlled
 * unavailable page rather than redirecting" — a bare JSON error body (the
 * previous behavior) is not a page a visitor scanning a printed code can
 * make sense of. This is a raw `Response`, not a rendered React page —
 * `/r/[slug]` is a Route Handler on the hot redirect path, not a page
 * route, so this is deliberately self-contained inline HTML/CSS rather
 * than pulling in the app's normal layout/stylesheet pipeline (Module
 * 3.13 cares about exactly this: keep the redirect path lightweight).
 */
function renderUnavailablePage(status: number, title: string, message: string): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — QRForge</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; font-family: system-ui, -apple-system, sans-serif; padding: 1.5rem; }
  .card { max-width: 24rem; text-align: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 2rem 1.5rem; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
  h1 { margin: 0 0 0.5rem; font-size: 1.05rem; font-weight: 600; color: #0f172a; }
  p { margin: 0; font-size: 0.875rem; color: #64748b; }
</style>
</head>
<body>
<main class="card">
<h1>${title}</h1>
<p>${message}</p>
</main>
</body>
</html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

/**
 * Public redirect entry point for every dynamic QR code (Module 3.6). Never
 * statically optimized/cached — each request must re-resolve the slug so a
 * destination change (or a pause) takes effect on the very next scan, per
 * the module's own "cache strategy" requirement.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  const clientIp = readClientIp(request.headers);
  const resolution = await resolveDynamicQrRedirect(
    slug,
    clientIp ? { key: `redirect:${clientIp}`, ...REDIRECT_RATE_LIMIT } : undefined,
  );

  if (resolution.status === "rate_limited") {
    return renderUnavailablePage(
      429,
      "Too many requests",
      "This link is being accessed too quickly. Please try again in a moment.",
    );
  }
  if (resolution.status === "not_found") {
    return renderUnavailablePage(
      404,
      "Link not found",
      "This QR code link doesn't exist, or may have been deleted.",
    );
  }
  if (resolution.status === "inactive") {
    return renderUnavailablePage(
      410,
      "Link not active",
      "The owner has paused or archived this QR code. Check back later or contact them directly.",
    );
  }

  // Scheduled via `after()` so recording a scan never delays the redirect
  // itself — the visitor gets sent on their way immediately either way.
  // Headers are read now, synchronously, and passed in — not re-read
  // inside the `after()` callback.
  const metadata = {
    referrer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
    countryCode: readEdgeCountryCode(request.headers),
  };
  after(() => recordQrScan(slug, metadata));

  return NextResponse.redirect(resolution.destinationUrl);
}
