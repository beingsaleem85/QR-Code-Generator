import Link from "next/link";
import { QRCodeStatusBadge } from "@/components/dashboard/QRCodeStatusBadge";
import { Card } from "@/components/ui/Card";
import type { QRCodeSummary } from "@/types/qr-record";

interface QRCodeCardProps {
  qrCode: QRCodeSummary;
}

export function QRCodeCard({ qrCode }: QRCodeCardProps) {
  return (
    <Link href={`/dashboard/qr-codes/${qrCode.id}`}>
      <Card className="flex flex-col gap-2 p-4 transition-colors hover:border-primary">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{qrCode.name}</p>
          <QRCodeStatusBadge status={qrCode.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          {qrCode.qrType} &middot; {qrCode.mode} &middot; {qrCode.scanCount} scans
        </p>
      </Card>
    </Link>
  );
}
