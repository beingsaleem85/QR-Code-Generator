import { createSignedAssetUrl } from "@/lib/qr/signed-asset-url";
import { Card } from "@/components/ui/Card";

interface AudioLandingPageProps {
  payloadData: Record<string, unknown>;
}

interface AudioPayload {
  path?: string;
  title?: string;
  description?: string;
}

export async function AudioLandingPage({ payloadData }: AudioLandingPageProps) {
  const { path, title, description } = payloadData as AudioPayload;
  const signedUrl = path ? await createSignedAssetUrl("qr-media", path) : null;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="flex w-full max-w-md flex-col gap-3 p-6">
        <p className="text-sm font-medium text-foreground">{title || "Audio"}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        {signedUrl ? (
          <audio controls className="w-full" src={signedUrl}>
            Your browser doesn&apos;t support inline audio playback.
          </audio>
        ) : (
          <p className="text-sm text-muted-foreground">
            This audio isn&apos;t available right now.
          </p>
        )}
      </Card>
    </main>
  );
}
