import Link from "next/link";
import { QRCodeRowActions } from "@/components/dashboard/QRCodeRowActions";
import { QRCodeStatusBadge } from "@/components/dashboard/QRCodeStatusBadge";
import { QRCodeFolderSelect } from "@/components/dashboard/QRCodeFolderSelect";
import { getQrTypeDefinition } from "@/lib/qr/registry";
import type { QrCodeRecord } from "@/lib/qr/records";
import type { QrFolder } from "@/types/folder";

interface QRCodeTableProps {
  qrCodes: QrCodeRecord[];
  folders?: QrFolder[];
}

export function QRCodeTable({ qrCodes, folders = [] }: QRCodeTableProps) {
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
          {folders.length > 0 ? <th className="py-2 font-medium">Folder</th> : null}
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
            <td className="py-2 text-muted-foreground">
              {getQrTypeDefinition(qrCode.qrType).label}
            </td>
            <td className="py-2 text-muted-foreground capitalize">{qrCode.mode}</td>
            <td className="py-2">
              <QRCodeStatusBadge status={qrCode.status} />
            </td>
            <td className="py-2 text-muted-foreground">{qrCode.scanCount}</td>
            <td className="py-2 text-muted-foreground">{qrCode.updatedAt}</td>
            {folders.length > 0 ? (
              <td className="py-2">
                <QRCodeFolderSelect
                  qrCodeId={qrCode.id}
                  folderId={qrCode.folderId}
                  folders={folders}
                />
              </td>
            ) : null}
            <td className="py-2">
              <QRCodeRowActions qrCode={qrCode} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
