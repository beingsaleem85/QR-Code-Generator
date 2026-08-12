import { QRCodeStatusBadge } from "@/components/dashboard/QRCodeStatusBadge";
import type { QRCodeSummary } from "@/types/qr-record";

interface QRCodeCardProps {
  qrCode: QRCodeSummary;
}

export function QRCodeCard({ qrCode }: QRCodeCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">{qrCode.name}</p>
        <QRCodeStatusBadge status={qrCode.status} />
      </div>
      <p className="text-xs text-gray-500">
        {qrCode.qrType} · {qrCode.mode} · {qrCode.scanCount} scans
      </p>
    </div>
  );
}
