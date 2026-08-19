import { resolveLandingPage } from "@/server/services/landing-page-resolution";
import { streamPdfFromPath } from "@/lib/qr/pdf-proxy-stream";

/**
 * Same-origin PDF delivery for the in-app viewer (`PdfViewer`), reached via
 * `/p/[slug]`. The slug is the only client-controlled input — it's resolved
 * server-side to a fixed Storage path on every request, the same way
 * `/p/[slug]` itself resolves a QR, so this can never become an open proxy
 * for arbitrary URLs or paths. See `streamPdfFromPath` for the actual
 * signing/streaming logic, shared with `/api/pdf-view/[token]`.
 *
 * Deliberately doesn't distinguish "unknown slug" from "paused/archived" in
 * its response (both -> 404) — this endpoint is meant to be an invisible
 * implementation detail, so it shouldn't leak whether a slug exists at all
 * when the QR behind it isn't currently active.
 *
 * Never records a scan — see `PdfExperience`'s doc comment for why.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const resolution = await resolveLandingPage(slug);

  if (resolution.status !== "ok" || resolution.qrType !== "pdf") {
    return new Response("Not found", { status: 404 });
  }

  return streamPdfFromPath(resolution.payloadData.path, request.headers.get("range"));
}
