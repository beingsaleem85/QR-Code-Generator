import { notFound } from "next/navigation";
import { resolvePublicToken } from "@/server/services/public-token-resolution";
import { PdfExperience } from "@/components/landing/PdfExperience";
import { InactiveQrCard } from "@/components/landing/InactiveQrCard";

/**
 * Opaque, privacy-preserving public entry point for a PDF QR created with
 * "Open PDF directly" already on — printed into the QR image instead of
 * `/p/[slug]` (`resolveEncodedPayload`) so a camera app's QR preview (or
 * anyone inspecting the code) can't infer a filename, database id, slug, or
 * owner from it. Only ever reached for a PDF QR; the token itself carries
 * no information, so an unknown, paused, archived, or non-PDF token all
 * resolve the same way an unknown `/p/[slug]` would.
 *
 * Deliberately thin: the actual "landing page vs in-app viewer" decision
 * and scan recording live in `PdfExperience`, shared with `/p/[slug]`'s own
 * "pdf" case, so this route only ever needs to handle token resolution.
 */
export const dynamic = "force-dynamic";

export default async function PublicViewerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resolution = await resolvePublicToken(token);

  if (resolution.status === "not_found") {
    notFound();
  }
  if (resolution.status === "ok" && resolution.qrType !== "pdf") {
    notFound();
  }
  if (resolution.status === "inactive") {
    return <InactiveQrCard />;
  }

  return (
    <PdfExperience
      slug={resolution.slug}
      payloadData={resolution.payloadData}
      proxyUrl={`/api/pdf-view/${token}`}
    />
  );
}
