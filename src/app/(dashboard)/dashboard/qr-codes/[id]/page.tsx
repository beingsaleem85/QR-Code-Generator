import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { QRCodeRowActions } from "@/components/dashboard/QRCodeRowActions";
import { QRCodeStatusBadge } from "@/components/dashboard/QRCodeStatusBadge";
import { QRDownloadActions } from "@/components/qr/QRDownloadActions";
import { buttonVariants } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QrPlaceholderGraphic } from "@/components/ui/QrPlaceholderGraphic";
import { getQrTypeDefinition } from "@/lib/qr/registry";
import { resolveEncodedPayload } from "@/lib/qr/render";
import { buildRedirectUrl } from "@/lib/qr/redirect-url";
import { deriveDestinationSummary } from "@/lib/qr/records";
import { getQrCodeById } from "@/lib/qr/queries";
import { renderStyledQrSvg } from "@/lib/qr/styled-svg";

export default async function QrCodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const qrCode = await getQrCodeById(id);

  if (!qrCode) {
    notFound();
  }

  const typeDefinition = getQrTypeDefinition(qrCode.qrType);
  const destinationSummary = deriveDestinationSummary(qrCode.qrType, qrCode.payloadData);

  // Server-rendered — no client JS needed just to see the QR. Real
  // regeneration from saved config (Module 3.5); dynamic codes always
  // encode this app's own /r/[slug] link, never the raw destination
  // (Module 3.6) — never a stored image either way.
  const payload = resolveEncodedPayload(
    qrCode.mode,
    qrCode.qrType,
    qrCode.payloadData,
    qrCode.slug,
  );
  const preview = payload ? await renderStyledQrSvg(payload, qrCode.designConfig) : null;

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title={qrCode.name}
        action={
          <Link
            href={`/dashboard/qr-codes/${qrCode.id}/edit`}
            className={buttonVariants({ size: "sm" })}
          >
            Edit
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 px-4 pb-6 sm:px-6 lg:grid-cols-[280px_1fr]">
        <Card className="flex flex-col items-center gap-4 p-6">
          <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-border bg-background p-3">
            {preview ? (
              <div
                role="img"
                aria-label="QR code preview"
                className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: preview.svg }}
              />
            ) : (
              <QrPlaceholderGraphic size={120} />
            )}
          </div>
          <QRDownloadActions
            qrType={qrCode.qrType}
            mode={qrCode.mode}
            content={qrCode.payloadData}
            design={qrCode.designConfig}
            name={qrCode.name}
            slug={qrCode.slug}
          />
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <QRCodeStatusBadge status={qrCode.status} />
              <span className="text-sm text-muted-foreground">{typeDefinition.label}</span>
              <span className="text-sm text-muted-foreground capitalize">
                &middot; {qrCode.mode}
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                {qrCode.mode === "dynamic" ? "Current destination" : "Destination / content"}
              </p>
              <p className="text-sm break-all text-foreground">{destinationSummary}</p>
            </div>

            {qrCode.mode === "dynamic" && qrCode.slug ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Printed QR links to
                </p>
                <p className="text-sm break-all text-foreground">{buildRedirectUrl(qrCode.slug)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This link never changes — edit the destination above to redirect it elsewhere
                  without reprinting the code.
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Created</p>
                <p className="text-foreground">{qrCode.createdAt}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Updated</p>
                <p className="text-foreground">{qrCode.updatedAt}</p>
              </div>
            </div>
          </Card>

          {qrCode.mode === "dynamic" ? (
            <Card className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {qrCode.scanCount.toLocaleString()} scans
                </p>
                <p className="text-xs text-muted-foreground">
                  Dynamic codes track scans over time.
                </p>
              </div>
              <Link
                href={`/dashboard/qr-codes/${qrCode.id}/analytics`}
                className="shrink-0 text-sm font-medium text-primary hover:underline"
              >
                View analytics &rarr;
              </Link>
            </Card>
          ) : null}

          <Card className="flex flex-col gap-3 p-5">
            <p className="text-sm font-medium text-foreground">Manage</p>
            <QRCodeRowActions qrCode={qrCode} showDownload={false} />
          </Card>
        </div>
      </div>
    </div>
  );
}
