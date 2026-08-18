"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { duplicateQrCode, deleteQrCode, setQrCodeStatus } from "@/lib/qr/actions";
import { buildQrPayload, slugifyForFilename } from "@/lib/qr/render";
import { renderStyledQrPngDataUrl } from "@/lib/qr/styled-svg";
import type { QrCodeRecord } from "@/lib/qr/records";

interface QRCodeRowActionsProps {
  qrCode: QrCodeRecord;
  /** The QR detail page has its own richer download UI (`QRDownloadActions`,
   * with a resolution picker) — set false there to avoid a redundant
   * second download button. Defaults to true for list/card usage. */
  showDownload?: boolean;
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

type Busy = "download" | "duplicate" | "archive" | "delete" | null;

/**
 * Quick per-row actions for the dashboard QR list (Module 3.5): Download,
 * Duplicate, Archive/Unarchive, Delete (with confirmation). Regenerates
 * the download from the saved `payload_data`/`design_config` — never a
 * stored image — the same rule the generator itself follows. `router
 * .refresh()` after a mutation re-fetches the Server Component list rather
 * than hand-patching local state, keeping this the single source of truth.
 */
export function QRCodeRowActions({ qrCode, showDownload = true }: QRCodeRowActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleDownload = async () => {
    setBusy("download");
    setError(null);
    try {
      const payload = buildQrPayload(qrCode.qrType, qrCode.payloadData);
      if (!payload) {
        setError("Can't regenerate this QR code's content.");
        return;
      }
      const { dataUrl } = await renderStyledQrPngDataUrl(payload, qrCode.designConfig, 1024);
      triggerDownload(dataUrl, `${slugifyForFilename(qrCode.name)}-qr.png`);
    } finally {
      setBusy(null);
    }
  };

  const handleDuplicate = async () => {
    setBusy("duplicate");
    setError(null);
    const result = await duplicateQrCode(qrCode.id);
    setBusy(null);
    if (!result.data) {
      setError(result.error);
      return;
    }
    router.push(`/dashboard/qr-codes/${result.data.id}`);
  };

  const handleArchiveToggle = async () => {
    setBusy("archive");
    setError(null);
    const nextStatus = qrCode.status === "archived" ? "active" : "archived";
    const result = await setQrCodeStatus(qrCode.id, nextStatus);
    setBusy(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const openDeleteDialog = () => dialogRef.current?.showModal();
  const closeDeleteDialog = () => dialogRef.current?.close();

  const handleDelete = async () => {
    setBusy("delete");
    setError(null);
    const result = await deleteQrCode(qrCode.id);
    setBusy(null);
    closeDeleteDialog();
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {showDownload ? (
        <Button variant="ghost" size="sm" onClick={handleDownload} disabled={busy !== null}>
          {busy === "download" ? "Preparing..." : "Download"}
        </Button>
      ) : null}
      <Button variant="ghost" size="sm" onClick={handleDuplicate} disabled={busy !== null}>
        {busy === "duplicate" ? "Duplicating..." : "Duplicate"}
      </Button>
      <Button variant="ghost" size="sm" onClick={handleArchiveToggle} disabled={busy !== null}>
        {busy === "archive" ? "Working..." : qrCode.status === "archived" ? "Unarchive" : "Archive"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={openDeleteDialog}
        disabled={busy !== null}
        aria-label={`Delete ${qrCode.name}`}
      >
        Delete
      </Button>

      {error ? <p className="w-full text-xs text-destructive">{error}</p> : null}

      <dialog
        ref={dialogRef}
        aria-label={`Confirm delete ${qrCode.name}`}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDeleteDialog();
        }}
        className="m-auto rounded-xl border border-border bg-surface p-0 shadow-sm backdrop:bg-foreground/40"
      >
        <div className="flex w-80 max-w-[85vw] flex-col gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-foreground">Delete {qrCode.name}?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              This permanently deletes the QR code and its scan history. This can&apos;t be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={busy !== null}
            >
              {busy === "delete" ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
