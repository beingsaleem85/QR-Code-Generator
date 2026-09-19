"use client";

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
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  allSelected?: boolean;
  someSelected?: boolean;
}

export function QRCodeTable({
  qrCodes,
  folders = [],
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected = false,
  someSelected = false,
}: QRCodeTableProps) {
  const isSelectable = typeof onToggleSelect === "function";

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-xs text-muted-foreground uppercase">
          {isSelectable ? (
            <th className="w-10 px-3 py-3 first:pl-4">
              <input
                type="checkbox"
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                checked={allSelected && qrCodes.length > 0}
                onChange={onToggleSelectAll}
                aria-label="Select all QR codes on this page"
                className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary"
              />
            </th>
          ) : null}
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
        {qrCodes.map((qrCode) => {
          const isSelected = selectedIds?.has(qrCode.id) ?? false;
          return (
            <tr
              key={qrCode.id}
              className={`border-b border-border transition-colors duration-150 last:border-0 hover:bg-background ${
                isSelected ? "bg-primary/5" : ""
              }`}
            >
              {isSelectable ? (
                <td className="w-10 px-3 py-3 first:pl-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect?.(qrCode.id)}
                    aria-label={`Select ${qrCode.name}`}
                    className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary"
                  />
                </td>
              ) : null}
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
          );
        })}
      </tbody>
    </table>
  );
}