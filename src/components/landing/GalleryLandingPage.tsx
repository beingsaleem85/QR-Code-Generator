import { createSignedAssetUrl } from "@/lib/qr/signed-asset-url";
import { Card } from "@/components/ui/Card";

interface GalleryLandingPageProps {
  payloadData: Record<string, unknown>;
}

interface GalleryImagePayload {
  path?: string;
  fileName?: string;
  caption?: string;
}

export async function GalleryLandingPage({ payloadData }: GalleryLandingPageProps) {
  const images = (
    Array.isArray(payloadData.images) ? payloadData.images : []
  ) as GalleryImagePayload[];

  const resolved = await Promise.all(
    images.map(async (image) => ({
      ...image,
      signedUrl: image.path ? await createSignedAssetUrl("qr-gallery", image.path) : null,
    })),
  );

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-6">
      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {resolved.map((image, index) =>
          image.signedUrl ? (
            <Card key={image.path ?? index} className="flex flex-col gap-2 overflow-hidden p-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- a short-lived signed Storage URL, not a locally-optimizable/remote-pattern-known asset. */}
              <img
                src={image.signedUrl}
                alt={image.caption || image.fileName || `Image ${index + 1}`}
                className="aspect-square w-full object-cover"
              />
              {image.caption ? (
                <p className="px-3 pb-3 text-sm text-muted-foreground">{image.caption}</p>
              ) : null}
            </Card>
          ) : null,
        )}
      </div>
      {resolved.every((image) => !image.signedUrl) ? (
        <Card className="max-w-sm p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This gallery isn&apos;t available right now.
          </p>
        </Card>
      ) : null}
    </main>
  );
}
