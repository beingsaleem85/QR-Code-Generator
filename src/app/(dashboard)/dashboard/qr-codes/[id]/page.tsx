import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { QRCodeStatusBadge } from "@/components/dashboard/QRCodeStatusBadge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QrPlaceholderGraphic } from "@/components/ui/QrPlaceholderGraphic";
import { getQrTypeDefinition } from "@/lib/qr/registry";
import { findMockQrCode } from "@/lib/qr/mock-data";

export default async function QrCodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const qrCode = findMockQrCode(id);

  if (!qrCode) {
    notFound();
  }

  const typeDefinition = getQrTypeDefinition(qrCode.qrType);

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
          <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-border bg-background">
            <QrPlaceholderGraphic size={120} />
          </div>
          <div className="flex w-full flex-col gap-2">
            <Button variant="secondary" disabled className="w-full">
              Download PNG
            </Button>
            <Button variant="secondary" disabled className="w-full">
              Download SVG
            </Button>
          </div>
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
                Destination / content
              </p>
              <p className="text-sm break-all text-foreground">{qrCode.destinationSummary}</p>
            </div>

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

          <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-surface p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">Danger zone</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" disabled>
                Archive
              </Button>
              <Button variant="destructive" disabled>
                Delete
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Archive and delete are wired to real data in Module 3.11.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
