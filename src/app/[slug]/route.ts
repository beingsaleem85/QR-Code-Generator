import { NextResponse, after } from "next/server";
import { resolveDynamicQrRedirect } from "@/server/services/redirect-resolution";
import { resolveLandingPage } from "@/server/services/landing-page-resolution";
import { recordQrScan } from "@/lib/qr/scan-tracking";
import { readClientIp } from "@/lib/rate-limit";
import { readEdgeCountryCode } from "@/lib/qr/edge-headers";
import { isReservedSlug } from "@/lib/qr/reserved-slugs";

const REDIRECT_RATE_LIMIT = { maxPerWindow: 60, windowSeconds: 60 };

function renderUnavailablePage(status: number, title: string, message: string): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — QRForge</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; font-family: system-ui, -apple-system, sans-serif; padding: 1.5rem; }
  .card { max-width: 24rem; text-align: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 2rem 1.5rem; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
  h1 { margin: 0 0 0.5rem; font-size: 1.05rem; font-weight: 600; color: #0f172a; }
  p { margin: 0; font-size: 0.875rem; color: #64748b; }
</style>
</head>
<body>
<main class="card">
<h1>${title}</h1>
<p>${message}</p>
</main>
</body>
</html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

export const dynamic = "force-dynamic";

/**
 * Root-level vanity link resolver (`https://qrforge.space/:slug`).
 * Resolves dynamic redirects and forwards hosted landing-page QR codes.
 * Strictly prevents shadowing reserved application and marketing routes.
 */
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  // Never intercept reserved routes or static paths
  if (isReservedSlug(slug)) {
    return renderUnavailablePage(
      404,
      "Link not found",
      "This QR code link doesn't exist, or may have been deleted.",
    );
  }

  const clientIp = readClientIp(request.headers);

  // 1. Try resolving as a direct dynamic redirect (URL, WhatsApp, etc.)
  const redirectResolution = await resolveDynamicQrRedirect(
    slug,
    clientIp ? { key: `redirect:${clientIp}`, ...REDIRECT_RATE_LIMIT } : undefined,
  );

  if (redirectResolution.status === "rate_limited") {
    return renderUnavailablePage(
      429,
      "Too many requests",
      "This link is being accessed too quickly. Please try again in a moment.",
    );
  }
  if (redirectResolution.status === "inactive") {
    return renderUnavailablePage(
      410,
      "This QR code is currently inactive",
      "The QR code owner needs to reactivate their QRForge account.",
    );
  }
  if (redirectResolution.status === "ok") {
    const metadata = {
      referrer: request.headers.get("referer"),
      userAgent: request.headers.get("user-agent"),
      countryCode: readEdgeCountryCode(request.headers),
    };
    after(() => recordQrScan(slug, metadata));

    const response = NextResponse.redirect(redirectResolution.destinationUrl, 302);
    response.headers.set("Cache-Control", "private, no-cache, no-store, max-age=0, must-revalidate");
    return response;
  }

  // 2. If not a direct redirect, check if it's a hosted landing-page QR (PDF, Menu, Multi-link, etc.)
  const landingResolution = await resolveLandingPage(slug);
  if (landingResolution.status === "inactive") {
    return renderUnavailablePage(
      410,
      "This QR code is currently inactive",
      "The QR code owner needs to reactivate their QRForge account.",
    );
  }
  if (landingResolution.status === "ok") {
    const url = new URL(request.url);
    url.pathname = `/p/${slug}`;
    return NextResponse.rewrite(url);
  }

  return renderUnavailablePage(
    404,
    "Link not found",
    "This QR code link doesn't exist, or may have been deleted.",
  );
}
