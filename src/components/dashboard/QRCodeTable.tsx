import Link from "next/link";
import { QRCodeRowActions } from "@/components/dashboard/QRCodeRowActions";
import { QRCodeStatusBadge } from "@/components/dashboard/QRCodeStatusBadge";
import type { QrCodeRecord } from "@/lib/qr/records";

interface QRCodeTableProps {
  qrCodes: QrCodeRecord[];
}

export function QRCodeTable({ qrCodes }: QRCodeTableProps) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-xs text-muted-foreground uppercase">
          <th className="py-2 font-medium">Name</th>
          <th className="py-2 font-medium">Type</th>
          <th className="py-2 font-medium">Mode</th>
          <th className="py-2 font-medium">Status</th>
          <th className="py-2 font-medium">Scans</th>
          <th className="py-2 font-medium">Updated</th>
          <th className="py-2 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {qrCodes.map((qrCode) => (
          <tr key={qrCode.id} className="border-b border-border last:border-0">
            <td className="py-2">
              <Link
                href={`/dashboard/qr-codes/${qrCode.id}`}
                className="font-medium text-foreground hover:text-primary"
              >
                {qrCode.name}
              </Link>
            </td>
            <td className="py-2 text-muted-foreground">{qrCode.qrType}</td>
            <td className="py-2 text-muted-foreground capitalize">{qrCode.mode}</td>
            <td className="py-2">
              <QRCodeStatusBadge status={qrCode.status} />
            </td>
            <td className="py-2 text-muted-foreground">{qrCode.scanCount}</td>
            <td className="py-2 text-muted-foreground">{qrCode.updatedAt}</td>
            <td className="py-2">
              <QRCodeRowActions qrCode={qrCode} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
