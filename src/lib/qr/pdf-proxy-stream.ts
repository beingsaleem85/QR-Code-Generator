import "server-only";
import { createSignedAssetUrl } from "@/lib/qr/signed-asset-url";

function sanitizePdfDownloadName(rawName?: string | null): string {
  if (!rawName || typeof rawName !== "string") return "document.pdf";
  const base = rawName.replace(/^.*[\\/]/, "").trim();
  const clean = base.replace(/[\x00-\x1F\x7F"\r\n]/g, "").trim();
  if (!clean) return "document.pdf";
  return clean.toLowerCase().endsWith(".pdf") ? clean : `${clean}.pdf`;
}

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
  fileName?: string | null,
  disposition: "inline" | "attachment" = "inline",
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

  const safeName = sanitizePdfDownloadName(fileName);
  const safeAscii = safeName.replace(/[^\x20-\x7E]/g, "_");
  headers.set(
    "Content-Disposition",
    `${disposition}; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
  );

  for (const name of ["content-length", "content-range", "accept-ranges"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
