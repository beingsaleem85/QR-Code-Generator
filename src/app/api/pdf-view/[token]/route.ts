import { resolvePublicToken } from "@/server/services/public-token-resolution";
import { streamPdfFromPath } from "@/lib/qr/pdf-proxy-stream";

/**
 * Same-origin PDF delivery for the in-app viewer, reached via the opaque
 * `/v/[token]` public link. Mirrors `/api/public-pdf/[slug]` exactly, just
 * keyed by `public_token` instead of `slug` (`resolvePublicToken`) — see
 * that route and `streamPdfFromPath` for the shared rationale. Also gated
 * on `qrType === "pdf"`: a token should only ever exist for a PDF QR, but
 * this checks it independently rather than trusting that invariant alone.
 *
 * Never records a scan — see `PdfExperience`'s doc comment for why.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const resolution = await resolvePublicToken(token);

  if (resolution.status !== "ok" || resolution.qrType !== "pdf") {
    return new Response("Not found", { status: 404 });
  }

  return streamPdfFromPath(resolution.payloadData.path, request.headers.get("range"));
}
