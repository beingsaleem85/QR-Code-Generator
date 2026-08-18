import { toEmbeddableVideoUrl } from "@/lib/qr/video-embed";
import { isSafeRedirectTarget } from "@/lib/qr/redirect-url";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";

interface VideoLandingPageProps {
  payloadData: Record<string, unknown>;
}

interface VideoPayload {
  url?: string;
  title?: string;
}

export function VideoLandingPage({ payloadData }: VideoLandingPageProps) {
  const { url, title } = payloadData as VideoPayload;
  // Defense-in-depth against open-redirect/embed abuse, same rule as the
  // /r/[slug] redirect route — never trust a stored URL unconditionally.
  const safeUrl = url && isSafeRedirectTarget(url) ? url : null;
  const embedUrl = safeUrl ? toEmbeddableVideoUrl(safeUrl) : null;

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-6">
      <Card className="flex w-full max-w-2xl flex-col gap-4 p-6">
        {title ? <p className="text-sm font-medium text-foreground">{title}</p> : null}

        {embedUrl ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
            <iframe
              src={embedUrl}
              title={title || "Video"}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : safeUrl ? (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ className: "w-full" })}
          >
            Watch video
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            This video isn&apos;t available right now.
          </p>
        )}
      </Card>
    </main>
  );
}
