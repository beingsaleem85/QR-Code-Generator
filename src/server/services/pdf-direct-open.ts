import "server-only";
import { createSignedAssetUrl } from "@/lib/qr/signed-asset-url";

interface PdfDirectOpenPayload {
  path?: unknown;
  openDirectly?: unknown;
}

/**
 * Resolves the real, current signed URL for a PDF QR configured to open
 * directly (`payload_data.openDirectly === true`) — or `null` when
 * direct-open isn't enabled, no file has been uploaded yet, or signing
 * fails for any reason (including RLS blocking it, e.g. a paused/archived
 * QR — `createSignedAssetUrl` itself never throws, see its own doc
 * comment). The caller (`/p/[slug]/page.tsx`) falls back to the normal PDF
 * landing page in every `null` case, so a signing failure degrades
 * gracefully rather than breaking the scan.
 *
 * Deliberately re-resolves the asset's Storage path from `payload_data` on
 * every call rather than caching anything — this is what makes file
 * replacement work without regenerating the QR: the printed code only ever
 * encodes the stable `/p/[slug]` URL (Module 3.8), never a Storage path or
 * a signed URL directly, so whichever path is *currently* saved is what
 * gets opened, matching the same "server resolves the current asset at
 * request time" contract `/r/[slug]` already uses for a plain redirect.
 */
export async function resolvePdfDirectOpenUrl(
  payloadData: Record<string, unknown>,
): Promise<string | null> {
  const payload = payloadData as PdfDirectOpenPayload;
  if (payload.openDirectly !== true) return null;
  if (typeof payload.path !== "string" || !payload.path) return null;

  return createSignedAssetUrl("qr-documents", payload.path);
}
