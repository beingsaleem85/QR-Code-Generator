import Link from "next/link";
import { QRCodeRowActions } from "@/components/dashboard/QRCodeRowActions";
import { QRCodeStatusBadge } from "@/components/dashboard/QRCodeStatusBadge";
import { Card } from "@/components/ui/Card";
import type { QrCodeRecord } from "@/lib/qr/records";

interface QRCodeCardProps {
  qrCode: QrCodeRecord;
}

/**
 * The card itself is a plain `<div>`, not a full-card `<Link>` (Module
 * 2.6's original shape) — `QRCodeRowActions` renders real buttons and a
 * `<dialog>` now (Module 3.5), and interactive elements can't nest inside
 * an `<a>`. Only the name links to the detail page, matching `QRCodeTable`.
 */
export function QRCodeCard({ qrCode }: QRCodeCardProps) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/dashboard/qr-codes/${qrCode.id}`}
          className="text-sm font-medium text-foreground hover:text-primary"
        >
          {qrCode.name}
        </Link>
        <QRCodeStatusBadge status={qrCode.status} />
      </div>
      <p className="text-xs text-muted-foreground">
        {qrCode.qrType} &middot; {qrCode.mode} &middot; {qrCode.scanCount} scans
      </p>
      <QRCodeRowActions qrCode={qrCode} />
    </Card>
  );
}
