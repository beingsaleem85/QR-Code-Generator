import { NextResponse, after } from "next/server";
import { resolveDynamicQrRedirect } from "@/server/services/redirect-resolution";
import { recordQrScan } from "@/lib/qr/scan-tracking";

/**
 * Public redirect entry point for every dynamic QR code (Module 3.6). Never
 * statically optimized/cached — each request must re-resolve the slug so a
 * destination change (or a pause) takes effect on the very next scan, per
 * the module's own "cache strategy" requirement.
 */
export const dynamic = "force-dynamic";

/**
 * Coarse geolocation "if available and legally appropriate" (Module 3.7):
 * reads whichever edge platform's own country header is present rather
 * than calling a geo-IP service — zero added latency, no third-party data
 * sharing, and genuinely absent (not guessed) on hosting that provides
 * neither. Vercel and Cloudflare are the two most common fronts for a
 * Next.js app; add another header here if a different platform is used.
 */
function readEdgeCountryCode(headers: Headers): string | null {
  return headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry");
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const resolution = await resolveDynamicQrRedirect(slug);

  if (resolution.status === "not_found") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (resolution.status === "inactive") {
    return NextResponse.json({ error: "inactive" }, { status: 410 });
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
