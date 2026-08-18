import { createSignedAssetUrl } from "@/lib/qr/signed-asset-url";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";

interface PdfLandingPageProps {
  payloadData: Record<string, unknown>;
}

interface PdfPayload {
  path?: string;
  fileName?: string;
}

export async function PdfLandingPage({ payloadData }: PdfLandingPageProps) {
  const { path, fileName } = payloadData as PdfPayload;
  const signedUrl = path ? await createSignedAssetUrl("qr-documents", path) : null;

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-6">
      <Card className="flex w-full max-w-2xl flex-col gap-4 p-6">
        <p className="text-sm font-medium text-foreground">{fileName ?? "Document"}</p>

        {signedUrl ? (
          <>
            <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-border">
              <iframe
                src={signedUrl}
                title={fileName ?? "PDF document"}
                className="h-full w-full"
              />
            </div>
            <a
              href={signedUrl}
              download={fileName}
              className={buttonVariants({ className: "w-full" })}
            >
              Download PDF
            </a>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            This document isn&apos;t available right now.
          </p>
        )}
      </Card>
    </main>
  );
}
