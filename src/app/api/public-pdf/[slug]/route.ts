import { resolveLandingPage } from "@/server/services/landing-page-resolution";
import { createSignedAssetUrl } from "@/lib/qr/signed-asset-url";

/**
 * Same-origin PDF delivery for the in-app viewer (`PdfViewer`). The slug is
 * the only client-controlled input — it's resolved server-side to a fixed
 * Storage path on every request, the same way `/p/[slug]` itself resolves a
 * QR, so this can never become an open proxy for arbitrary URLs or paths.
 *
 * Internally signs a short-lived Storage URL (the existing
 * `createSignedAssetUrl` helper — no new signing logic) and streams that
 * response straight through, forwarding a `Range` header when present. The
 * signed URL itself never reaches the client: only this route ever fetches
 * it, fresh, per request, so it's never cached or persisted anywhere the
 * printed QR or the viewer's own URL could pick it up. This is what keeps
 * the visible browser URL on `/p/[slug]` instead of `*.supabase.co` — the
 * root problem with the previous top-level-redirect implementation.
 *
 * Deliberately doesn't distinguish "unknown slug" from "paused/archived" in
 * its response (both -> 404) — this endpoint is meant to be an invisible
 * implementation detail, so it shouldn't leak whether a slug exists at all
 * when the QR behind it isn't currently active.
 *
 * Never records a scan: `/p/[slug]/page.tsx` records exactly one scan per
 * viewer load. pdf.js may issue several Range requests against this route
 * per load (and re-issues them on scroll/zoom) — counting those here would
 * inflate scan counts far past the "one load, one scan" semantics the rest
 * of the app already relies on.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const resolution = await resolveLandingPage(slug);

  if (resolution.status !== "ok" || resolution.qrType !== "pdf") {
    return new Response("Not found", { status: 404 });
  }

  const path = resolution.payloadData.path;
  if (typeof path !== "string" || !path) {
    return new Response("Not found", { status: 404 });
  }

  const signedUrl = await createSignedAssetUrl("qr-documents", path);
  if (!signedUrl) {
    return new Response("Not found", { status: 404 });
  }

  const rangeHeader = request.headers.get("range");
  let upstream: Response;
  try {
    upstream = await fetch(signedUrl, {
      headers: rangeHeader ? { range: rangeHeader } : undefined,
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Cache-Control", "private, no-store");
  for (const name of ["content-length", "content-range", "accept-ranges"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
