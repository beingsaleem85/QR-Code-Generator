import { notFound } from "next/navigation";
import { resolveLandingPage } from "@/server/services/landing-page-resolution";
import { PdfExperience } from "@/components/landing/PdfExperience";
import { InactiveQrCard } from "@/components/landing/InactiveQrCard";
import { GalleryLandingPage } from "@/components/landing/GalleryLandingPage";
import { AudioLandingPage } from "@/components/landing/AudioLandingPage";
import { VideoLandingPage } from "@/components/landing/VideoLandingPage";
import { AppLandingPage } from "@/components/landing/AppLandingPage";
import { SocialLandingPage } from "@/components/landing/SocialLandingPage";
import { MultiLinkLandingPage } from "@/components/landing/MultiLinkLandingPage";
import { MenuLandingPage } from "@/components/landing/MenuLandingPage";
import { FeedbackLandingPage } from "@/components/landing/FeedbackLandingPage";

/**
 * Public, unauthenticated hosted landing page for dynamic QR types that
 * need more than a plain redirect (Module 3.8: pdf, image gallery, audio,
 * video; Module 3.9: app, social, multi-link, menu, feedback — same
 * mechanism, just more type cases in the switch below). No route-group
 * layout — deliberately minimal chrome, since a visitor lands here straight
 * from a QR scan, not site navigation.
 *
 * A PDF QR created with "Open PDF directly" already on prints `/v/[token]`
 * instead of this route (`resolveEncodedPayload`) — but an existing QR
 * printed as `/p/[slug]` before that existed, or created with the toggle
 * off, keeps working here exactly as before; this route is never
 * invalidated for a PDF QR.
 */
export const dynamic = "force-dynamic";

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolution = await resolveLandingPage(slug);

  if (resolution.status === "not_found") {
    notFound();
  }

  if (resolution.status === "inactive") {
    return <InactiveQrCard />;
  }

  switch (resolution.qrType) {
    case "pdf":
      return (
        <PdfExperience
          slug={slug}
          payloadData={resolution.payloadData}
          proxyUrl={`/api/public-pdf/${slug}`}
        />
      );
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
