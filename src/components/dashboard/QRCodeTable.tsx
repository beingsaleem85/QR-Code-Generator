import { QRCodeStatusBadge } from "@/components/dashboard/QRCodeStatusBadge";
import type { QRCodeSummary } from "@/types/qr-record";

interface QRCodeTableProps {
  qrCodes: QRCodeSummary[];
}

export function QRCodeTable({ qrCodes }: QRCodeTableProps) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
          <th className="py-2 font-medium">Name</th>
          <th className="py-2 font-medium">Type</th>
          <th className="py-2 font-medium">Mode</th>
          <th className="py-2 font-medium">Status</th>
          <th className="py-2 font-medium">Scans</th>
          <th className="py-2 font-medium">Updated</th>
        </tr>
      </thead>
      <tbody>
        {qrCodes.map((qrCode) => (
          <tr key={qrCode.id} className="border-b border-gray-100">
            <td className="py-2">{qrCode.name}</td>
            <td className="py-2">{qrCode.qrType}</td>
            <td className="py-2 capitalize">{qrCode.mode}</td>
            <td className="py-2">
              <QRCodeStatusBadge status={qrCode.status} />
            </td>
            <td className="py-2">{qrCode.scanCount}</td>
            <td className="py-2">{qrCode.updatedAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
