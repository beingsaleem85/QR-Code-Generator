import "server-only";
import { createSignedAssetUrl } from "@/lib/qr/signed-asset-url";

/**
 * The common "resolve an asset path -> stream its bytes through" plumbing
 * shared by every same-origin PDF proxy route (`/api/public-pdf/[slug]`,
 * `/api/pdf-view/[token]`). Internally signs a fresh Storage URL (the
 * existing `createSignedAssetUrl` helper — no new signing logic) and
 * streams that response straight through, forwarding a `Range` header when
 * present — the signed URL itself never reaches the client, only this
 * function ever fetches it, fresh, per request.
 */
export async function streamPdfFromPath(
  path: unknown,
  rangeHeader: string | null,
): Promise<Response> {
  if (typeof path !== "string" || !path) {
    return new Response("Not found", { status: 404 });
  }

  const signedUrl = await createSignedAssetUrl("qr-documents", path);
  if (!signedUrl) {
    return new Response("Not found", { status: 404 });
  }

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
