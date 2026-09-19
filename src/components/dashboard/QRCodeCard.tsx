"use client";

import Link from "next/link";
import { QRCodeRowActions } from "@/components/dashboard/QRCodeRowActions";
import { QRCodeStatusBadge } from "@/components/dashboard/QRCodeStatusBadge";
import { QRCodeFolderSelect } from "@/components/dashboard/QRCodeFolderSelect";
import { Card } from "@/components/ui/Card";
import type { QrCodeRecord } from "@/lib/qr/records";
import type { QrFolder } from "@/types/folder";

interface QRCodeCardProps {
  qrCode: QrCodeRecord;
  folders?: QrFolder[];
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

/**
 * The card itself is a plain `<div>`, not a full-card `<Link>` (Module
 * 2.6's original shape) — `QRCodeRowActions` renders real buttons and a
 * `<dialog>` now (Module 3.5), and interactive elements can't nest inside
 * an `<a>`. Only the name links to the detail page, matching `QRCodeTable`.
 */
export function QRCodeCard({
  qrCode,
  folders = [],
  selected = false,
  onToggleSelect,
}: QRCodeCardProps) {
  return (
    <Card
      className={`flex flex-col gap-2.5 p-4 transition-all duration-150 hover:shadow-lg ${
        selected ? "border-primary/40 bg-primary/5 shadow-sm" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {onToggleSelect ? (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(qrCode.id)}
              aria-label={`Select ${qrCode.name}`}
              className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary"
            />
          ) : null}
          <Link
            href={`/dashboard/qr-codes/${qrCode.id}`}
            className="text-sm font-medium text-foreground hover:text-primary"
          >
            {qrCode.name}
          </Link>
        </div>
        <QRCodeStatusBadge status={qrCode.status} />
      </div>
      <p className="text-xs text-muted-foreground capitalize">
        {qrCode.qrType} &middot; {qrCode.mode} &middot; {qrCode.scanCount} scans
      </p>
      {folders.length > 0 ? (
        <QRCodeFolderSelect qrCodeId={qrCode.id} folderId={qrCode.folderId} folders={folders} />
      ) : null}
      <QRCodeRowActions qrCode={qrCode} />
    </Card>
  );
}