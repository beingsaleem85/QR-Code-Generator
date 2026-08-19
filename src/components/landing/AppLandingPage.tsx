import { headers } from "next/headers";
import { parseUserAgent } from "@/lib/qr/user-agent";
import { isSafeRedirectTarget } from "@/lib/qr/redirect-url";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";

interface AppLandingPageProps {
  payloadData: Record<string, unknown>;
}

interface AppPayload {
  title?: string;
  iosUrl?: string;
  androidUrl?: string;
  fallbackUrl?: string;
}

/**
 * Device-aware CTA: the visitor's own User-Agent (read server-side, same
 * `parseUserAgent` classifier Module 3.7 uses for scan analytics) picks
 * which store link is the primary button — iOS gets the App Store link
 * first, Android gets Google Play first, anything else falls back to
 * whichever links exist. Every safe link that *does* exist is still shown,
 * just not always first.
 */
export async function AppLandingPage({ payloadData }: AppLandingPageProps) {
  const { title, iosUrl, androidUrl, fallbackUrl } = payloadData as AppPayload;
  const requestHeaders = await headers();
  const { os } = parseUserAgent(requestHeaders.get("user-agent"));

  const safe = (url: string | undefined) => (url && isSafeRedirectTarget(url) ? url : null);
  const links = [
    { key: "ios", label: "Download on the App Store", url: safe(iosUrl) },
    { key: "android", label: "Get it on Google Play", url: safe(androidUrl) },
    { key: "fallback", label: "Visit website", url: safe(fallbackUrl) },
  ].filter((link) => link.url) as { key: string; label: string; url: string }[];

  const preferredKey = os === "iOS" ? "ios" : os === "Android" ? "android" : null;
  const ordered = preferredKey
    ? [
        ...links.filter((l) => l.key === preferredKey),
        ...links.filter((l) => l.key !== preferredKey),
      ]
    : links;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <Card className="flex w-full max-w-sm flex-col gap-3 p-6 text-center">
        {title ? <p className="text-lg font-semibold text-foreground">{title}</p> : null}
        {ordered.length > 0 ? (
          ordered.map((link, index) => (
            <a
              key={link.key}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: index === 0 ? "primary" : "secondary",
                className: "w-full",
              })}
            >
              {link.label}
            </a>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">This page isn&apos;t available right now.</p>
        )}
      </Card>
    </main>
  );
}
