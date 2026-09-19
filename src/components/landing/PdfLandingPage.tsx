import { FileText, Download, ExternalLink } from "lucide-react";
import { createSignedAssetUrl } from "@/lib/qr/signed-asset-url";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";

interface PdfLandingPageProps {
  payloadData: Record<string, unknown>;
  proxyUrl?: string;
}

interface PdfPayload {
  path?: string;
  fileName?: string;
  publicTitle?: string;
}

export async function PdfLandingPage({ payloadData, proxyUrl }: PdfLandingPageProps) {
  const { path, publicTitle } = payloadData as PdfPayload;
  const displayName =
    typeof publicTitle === "string" && publicTitle.trim().length > 0
      ? publicTitle.trim()
      : "Document";
  const downloadName = `${displayName.replace(/\.pdf$/i, "")}.pdf`;
  const docUrl = proxyUrl ?? (path ? await createSignedAssetUrl("qr-documents", path) : null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-surface-raised/30">
      <Card className="flex w-full max-w-3xl flex-col gap-4 p-5 sm:p-6 shadow-md border border-border bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-foreground truncate">
                {displayName}
              </h1>
              <p className="text-[11px] text-muted-foreground">PDF Document</p>
            </div>
          </div>
          {docUrl ? (
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "secondary", size: "sm", className: "gap-1.5 text-xs" })}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in tab</span>
              </a>
              <a
                href={docUrl}
                download={downloadName}
                className={buttonVariants({ size: "sm", className: "gap-1.5 text-xs" })}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </a>
            </div>
          ) : null}
        </div>

        {docUrl ? (
          <>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-border bg-background shadow-inner">
              <object
                data={docUrl}
                type="application/pdf"
                title={displayName}
                className="h-full w-full"
              >
                <iframe
                  src={docUrl}
                  title={displayName}
                  className="h-full w-full border-0"
                >
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-xs text-muted-foreground">
                    <FileText className="h-10 w-10 text-muted-foreground/50" />
                    <p className="font-medium text-foreground">{displayName}</p>
                    <p>PDF preview is ready to view.</p>
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ size: "sm" })}
                    >
                      Open PDF Document
                    </a>
                  </div>
                </iframe>
              </object>
            </div>
            <a
              href={docUrl}
              download={downloadName}
              className={buttonVariants({ className: "w-full gap-2 sm:hidden" })}
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </a>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">Document not available</p>
            <p className="text-xs">This PDF document could not be loaded right now.</p>
          </div>
        )}
      </Card>
    </main>
  );
}
