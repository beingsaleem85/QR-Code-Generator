"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Download,
  Copy,
  Pause,
  Play,
  Archive,
  ArchiveRestore,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { duplicateQrCode, deleteQrCode, setQrCodeStatus } from "@/lib/qr/actions";
import { resolveEncodedPayload, slugifyForFilename } from "@/lib/qr/render";
import { renderStyledQrPngDataUrl } from "@/lib/qr/styled-svg";
import { getQrTypeDefinition } from "@/lib/qr/registry";
import type { QrCodeRecord } from "@/lib/qr/records";

interface QRCodeRowActionsProps {
  qrCode: QrCodeRecord;
  /** The QR detail page has its own richer download UI (`QRDownloadActions`,
   * with a resolution picker) — set false there to avoid a redundant
   * second download button. Defaults to true for list/card usage. */
  showDownload?: boolean;
  /** Visible in kebab actions menu. Defaults to true. */
  showDuplicate?: boolean;
  /** Visible in kebab actions menu. Defaults to true. */
  showArchive?: boolean;
  /** Set on the QR's own detail page, where a successful delete leaves
   * nothing at the current URL to refresh into — without this, deleting
   * from `/dashboard/qr-codes/[id]` just re-fetched that same now-gone
   * record in place, landing the user on a bare not-found view instead of
   * back at the list. List/card usage leaves this unset, where a plain
   * `router.refresh()` is already correct (the row just disappears from
   * the list it's still on). */
  redirectAfterDeleteTo?: string;
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

type Busy = "download" | "duplicate" | "archive" | "pause" | "delete" | null;

/**
 * Module 3.11: "define behavior for linked storage assets and scan
 * history" — the confirmation dialog should actually say what's being
 * destroyed, not a generic message that under-discloses for a file-based
 * or feedback QR. Deletion itself already does the right thing (Module
 * 3.8/3.9's `deleteQrCode`: real Storage objects removed, scan events and
 * feedback submissions cascade via `ON DELETE CASCADE`) — this just makes
 * the disclosure match reality.
 */
function deleteScopeMessage(qrCode: QrCodeRecord): string {
  const parts = ["its scan history"];
  if (getQrTypeDefinition(qrCode.qrType).needsStorage) parts.push("any uploaded files");
  if (qrCode.qrType === "feedback") parts.push("any feedback received");
  return `This permanently deletes the QR code and ${parts.join(", ")}.`;
}

/**
 * Compact 3-dots kebab menu for dashboard list/table/card actions:
 * Download, Pause/Resume, Duplicate, Archive/Unarchive, Delete (with confirmation).
 */
export function QRCodeRowActions({
  qrCode,
  showDownload = true,
  showDuplicate = true,
  showArchive = true,
  redirectAfterDeleteTo,
}: QRCodeRowActionsProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleDownload = async () => {
    setBusy("download");
    setError(null);
    try {
      const payload = resolveEncodedPayload(
        qrCode.mode,
        qrCode.qrType,
        qrCode.payloadData,
        qrCode.slug,
        qrCode.publicToken,
      );
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

  const handlePauseToggle = async () => {
    setBusy("pause");
    setError(null);
    const nextStatus = qrCode.status === "paused" ? "active" : "paused";
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
    if (redirectAfterDeleteTo) {
      router.push(redirectAfterDeleteTo);
    }
    router.refresh();
  };

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        type="button"
        aria-label={`Actions for ${qrCode.name}`}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {menuOpen ? (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full z-40 mt-1 w-44 rounded-xl border border-border bg-surface p-1 shadow-lg backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100"
        >
          {showDownload ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                handleDownload();
              }}
              disabled={busy !== null}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-background disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{busy === "download" ? "Preparing..." : "Download"}</span>
            </button>
          ) : null}

          {qrCode.mode === "dynamic" && qrCode.status !== "archived" ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                handlePauseToggle();
              }}
              disabled={busy !== null}
              aria-label={`${qrCode.status === "paused" ? "Reactivate" : "Pause"} ${qrCode.name}`}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-background disabled:opacity-50"
            >
              {qrCode.status === "paused" ? (
                <Play className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Pause className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span>
                {busy === "pause"
                  ? "Working..."
                  : qrCode.status === "paused"
                    ? "Reactivate"
                    : "Pause"}
              </span>
            </button>
          ) : null}

          {showDuplicate ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                handleDuplicate();
              }}
              disabled={busy !== null}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-background disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{busy === "duplicate" ? "Duplicating..." : "Duplicate"}</span>
            </button>
          ) : null}

          {showArchive ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                handleArchiveToggle();
              }}
              disabled={busy !== null}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-background disabled:opacity-50"
            >
              {qrCode.status === "archived" ? (
                <ArchiveRestore className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Archive className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span>
                {busy === "archive"
                  ? "Working..."
                  : qrCode.status === "archived"
                    ? "Unarchive"
                    : "Archive"}
              </span>
            </button>
          ) : null}

          <div className="my-1 border-t border-border" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              openDeleteDialog();
            }}
            disabled={busy !== null}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}

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
              {deleteScopeMessage(qrCode)} This can&apos;t be undone.
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
