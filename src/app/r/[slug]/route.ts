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
  const referrer = request.headers.get("referer");
  after(() => recordQrScan(slug, referrer));

  return NextResponse.redirect(resolution.destinationUrl);
}
