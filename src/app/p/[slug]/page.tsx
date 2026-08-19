import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { resolveLandingPage } from "@/server/services/landing-page-resolution";
import { resolvePdfDirectOpenUrl } from "@/server/services/pdf-direct-open";
import { recordQrScan } from "@/lib/qr/scan-tracking";
import { readEdgeCountryCode } from "@/lib/qr/edge-headers";
import { isSafeRedirectTarget } from "@/lib/qr/redirect-url";
import { PdfDirectOpenRedirect } from "@/components/landing/PdfDirectOpenRedirect";
import { PdfLandingPage } from "@/components/landing/PdfLandingPage";
import { GalleryLandingPage } from "@/components/landing/GalleryLandingPage";
import { AudioLandingPage } from "@/components/landing/AudioLandingPage";
import { VideoLandingPage } from "@/components/landing/VideoLandingPage";
import { AppLandingPage } from "@/components/landing/AppLandingPage";
import { SocialLandingPage } from "@/components/landing/SocialLandingPage";
import { MultiLinkLandingPage } from "@/components/landing/MultiLinkLandingPage";
import { MenuLandingPage } from "@/components/landing/MenuLandingPage";
import { FeedbackLandingPage } from "@/components/landing/FeedbackLandingPage";
import { Card } from "@/components/ui/Card";

/**
 * Public, unauthenticated hosted landing page for dynamic QR types that
 * need more than a plain redirect (Module 3.8: pdf, image gallery, audio,
 * video; Module 3.9: app, social, multi-link, menu, feedback — same
 * mechanism, just more type cases in the switch below). No route-group
 * layout — deliberately minimal chrome, since a visitor lands here straight
 * from a QR scan, not site navigation.
 */
export const dynamic = "force-dynamic";

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolution = await resolveLandingPage(slug);

  if (resolution.status === "not_found") {
    notFound();
  }

  if (resolution.status === "inactive") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-sm p-6 text-center">
          <p className="text-sm font-medium text-foreground">This QR code isn&apos;t active</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The owner has paused or archived it. Check back later or contact them directly.
          </p>
        </Card>
      </main>
    );
  }

  switch (resolution.qrType) {
    case "pdf": {
      // "Open PDF directly" (payload_data.openDirectly): skip the landing
      // page and send the scanner straight to the current PDF, resolved
      // fresh on every request — never a signed URL baked into the printed
      // QR (those expire; this app never encodes one). Falls back to the
      // normal landing page when direct-open isn't enabled, no file has
      // been uploaded yet, or signing genuinely fails.
      const directUrl = await resolvePdfDirectOpenUrl(resolution.payloadData);
      if (directUrl && isSafeRedirectTarget(directUrl)) {
        // Same non-blocking scan-recording pattern as `/r/[slug]` — read
        // headers synchronously now, record the scan via `after()`.
        const requestHeaders = await headers();
        const metadata = {
          referrer: requestHeaders.get("referer"),
          userAgent: requestHeaders.get("user-agent"),
          countryCode: readEdgeCountryCode(requestHeaders),
        };
        after(() => recordQrScan(slug, metadata));
        return <PdfDirectOpenRedirect url={directUrl} />;
      }
      return <PdfLandingPage payloadData={resolution.payloadData} />;
    }
    case "images":
      return <GalleryLandingPage payloadData={resolution.payloadData} />;
    case "audio":
      return <AudioLandingPage payloadData={resolution.payloadData} />;
    case "video":
      return <VideoLandingPage payloadData={resolution.payloadData} />;
    case "app":
      return <AppLandingPage payloadData={resolution.payloadData} />;
    case "social":
      return <SocialLandingPage payloadData={resolution.payloadData} />;
    case "multi_link":
      return <MultiLinkLandingPage payloadData={resolution.payloadData} />;
    case "menu":
      return <MenuLandingPage payloadData={resolution.payloadData} />;
    case "feedback":
      return <FeedbackLandingPage slug={slug} payloadData={resolution.payloadData} />;
    default:
      notFound();
  }
}
