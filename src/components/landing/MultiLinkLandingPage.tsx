import { isSafeRedirectTarget } from "@/lib/qr/redirect-url";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";

interface MultiLinkLandingPageProps {
  payloadData: Record<string, unknown>;
}

interface QrLinkPayload {
  label?: string;
  url?: string;
}

export function MultiLinkLandingPage({ payloadData }: MultiLinkLandingPageProps) {
  const title = typeof payloadData.title === "string" ? payloadData.title : undefined;
  const links = (Array.isArray(payloadData.links) ? payloadData.links : []) as QrLinkPayload[];
  const safeLinks = links.filter(
    (link): link is { label: string; url: string } =>
      !!link.label && !!link.url && isSafeRedirectTarget(link.url),
  );

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-6">
      <Card className="flex w-full max-w-sm flex-col gap-3 p-6">
        {title ? (
          <p className="text-center text-lg font-semibold text-foreground">{title}</p>
        ) : null}
        {safeLinks.length > 0 ? (
          safeLinks.map((link, index) => (
            <a
              key={`${link.url}-${index}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "secondary", className: "w-full" })}
            >
              {link.label}
            </a>
          ))
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            This page isn&apos;t available right now.
          </p>
        )}
      </Card>
    </main>
  );
}
