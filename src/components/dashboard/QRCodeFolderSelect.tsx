"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { assignQrCodeFolder } from "@/lib/folders/actions";
import type { QrFolder } from "@/types/folder";

interface QRCodeFolderSelectProps {
  qrCodeId: string;
  folderId: string | null;
  folders: QrFolder[];
}

/** A per-row control, not part of `QRCodeRowActions` — assigning a folder is a single select, not a button-row action. */
export function QRCodeFolderSelect({ qrCodeId, folderId, folders }: QRCodeFolderSelectProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (folders.length === 0) return null;

  const handleChange = async (value: string) => {
    setBusy(true);
    await assignQrCodeFolder(qrCodeId, value || null);
    setBusy(false);
    router.refresh();
  };

  return (
    <Select
      value={folderId ?? ""}
      onChange={(event) => handleChange(event.target.value)}
      disabled={busy}
      aria-label="Folder"
      className="h-8 text-xs"
    >
      <option value="">Unfiled</option>
      {folders.map((folder) => (
        <option key={folder.id} value={folder.id}>
          {folder.name}
        </option>
      ))}
    </Select>
  );
}
