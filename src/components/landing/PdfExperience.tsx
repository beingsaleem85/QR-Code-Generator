import { headers } from "next/headers";
import { after } from "next/server";
import { recordQrScan } from "@/lib/qr/scan-tracking";
import { readEdgeCountryCode } from "@/lib/qr/edge-headers";
import { PdfViewer } from "@/components/landing/pdf-viewer/PdfViewer";
import { PdfLandingPage } from "@/components/landing/PdfLandingPage";

interface PdfExperienceProps {
  /** Used only to record a scan (`record_qr_scan` is slug-keyed) — never
   * passed down to a client component, so it's never sent to the browser
   * regardless of which public route (`/p/[slug]` or `/v/[token]`) resolved
   * this QR. */
  slug: string;
  payloadData: Record<string, unknown>;
  /** The same-origin PDF proxy URL for this route — `/api/public-pdf/[slug]`
   * or `/api/pdf-view/[token]`, built by the caller so this component never
   * needs to know which kind of public identifier resolved it. */
  proxyUrl: string;
}

/**
 * The PDF-specific "landing page vs in-app viewer" decision, shared by
 * every public route that can resolve a PDF QR, so this logic (and the
 * single scan-recording point) lives in exactly one place rather than
 * being duplicated per route.
 */
export async function PdfExperience({ slug, payloadData, proxyUrl }: PdfExperienceProps) {
  const payload = payloadData as { path?: unknown; fileName?: unknown; openDirectly?: unknown };
  const directOpen =
    payload.openDirectly === true && typeof payload.path === "string" && payload.path.length > 0;

  if (directOpen) {
    // Non-blocking scan recording, same pattern as `/r/[slug]` — read
    // headers synchronously now, record via `after()`. This is the ONLY
    // place a direct-open scan is recorded — the viewer's own requests to
    // the PDF proxy (including pdf.js's Range requests) never record a
    // scan, so one viewer load stays one scan regardless of which public
    // route reached it.
    const requestHeaders = await headers();
    const metadata = {
      referrer: requestHeaders.get("referer"),
      userAgent: requestHeaders.get("user-agent"),
      countryCode: readEdgeCountryCode(requestHeaders),
    };
    after(() => recordQrScan(slug, metadata));
    return (
      <PdfViewer
        proxyUrl={proxyUrl}
        fileName={typeof payload.fileName === "string" ? payload.fileName : "document.pdf"}
      />
    );
  }
  return <PdfLandingPage payloadData={payloadData} />;
}
