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
          <th className="px-3 py-3 font-semibold tracking-wide first:pl-4">Name</th>
          <th className="px-3 py-3 font-semibold tracking-wide">Type</th>
          <th className="px-3 py-3 font-semibold tracking-wide">Mode</th>
          <th className="px-3 py-3 font-semibold tracking-wide">Status</th>
          <th className="px-3 py-3 font-semibold tracking-wide">Scans</th>
          <th className="px-3 py-3 font-semibold tracking-wide">Updated</th>
          {folders.length > 0 ? (
            <th className="px-3 py-3 font-semibold tracking-wide">Folder</th>
          ) : null}
          <th className="px-3 py-3 font-semibold tracking-wide last:pr-4">Actions</th>
        </tr>
      </thead>
      <tbody>
        {qrCodes.map((qrCode) => (
          <tr
            key={qrCode.id}
            className="border-b border-border transition-colors duration-150 last:border-0 hover:bg-background"
          >
            <td className="px-3 py-3 first:pl-4">
              <Link
                href={`/dashboard/qr-codes/${qrCode.id}`}
                className="font-medium text-foreground hover:text-primary"
              >
                {qrCode.name}
              </Link>
            </td>
            <td className="px-3 py-3 text-muted-foreground">
              {getQrTypeDefinition(qrCode.qrType).label}
            </td>
            <td className="px-3 py-3 text-muted-foreground capitalize">{qrCode.mode}</td>
            <td className="px-3 py-3">
              <QRCodeStatusBadge status={qrCode.status} />
            </td>
            <td className="px-3 py-3 text-muted-foreground">{qrCode.scanCount}</td>
            <td className="px-3 py-3 text-muted-foreground">{qrCode.updatedAt}</td>
            {folders.length > 0 ? (
              <td className="px-3 py-3">
                <QRCodeFolderSelect
                  qrCodeId={qrCode.id}
                  folderId={qrCode.folderId}
                  folders={folders}
                />
              </td>
            ) : null}
            <td className="px-3 py-3 last:pr-4">
              <QRCodeRowActions qrCode={qrCode} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
