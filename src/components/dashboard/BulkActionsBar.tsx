"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";

export type BulkBusyAction = "delete" | "pause" | "resume" | "download" | null;

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => Promise<void>;
  onBulkPause: () => Promise<void>;
  onBulkResume: () => Promise<void>;
  onBulkDownload: () => Promise<void>;
  busyAction: BulkBusyAction;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkPause,
  onBulkResume,
  onBulkDownload,
  busyAction,
}: BulkActionsBarProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isBusy = busyAction !== null;

  if (selectedCount === 0) return null;

  const openDeleteDialog = () => dialogRef.current?.showModal();
  const closeDeleteDialog = () => dialogRef.current?.close();

  const handleConfirmDelete = async () => {
    closeDeleteDialog();
    await onBulkDelete();
  };

  return (
    <div
      role="region"
      aria-label="Bulk actions toolbar"
      className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <span data-testid="selected-count" className="text-sm font-medium text-foreground">
          {selectedCount} selected <span className="text-xs text-muted-foreground">(current page)</span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isBusy}
          aria-label="Clear selection"
          className="text-xs"
        >
          Clear selection
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onBulkDownload}
          disabled={isBusy}
          aria-label={`Download ${selectedCount} selected QR codes`}
        >
          {busyAction === "download" ? "Preparing..." : "Download selected"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onBulkPause}
          disabled={isBusy}
          aria-label={`Pause ${selectedCount} selected dynamic QR codes`}
        >
          {busyAction === "pause" ? "Pausing..." : "Pause selected"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onBulkResume}
          disabled={isBusy}
          aria-label={`Resume ${selectedCount} selected dynamic QR codes`}
        >
          {busyAction === "resume" ? "Resuming..." : "Resume selected"}
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={openDeleteDialog}
          disabled={isBusy}
          aria-label={`Delete ${selectedCount} selected QR codes`}
        >
          {busyAction === "delete" ? "Deleting..." : "Delete selected"}
        </Button>
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Confirm bulk deletion"
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDeleteDialog();
        }}
        className="m-auto rounded-xl border border-border bg-surface p-0 shadow-sm backdrop:bg-foreground/40"
      >
        <div className="flex w-88 max-w-[85vw] flex-col gap-4 p-5">
          <div>
            <p className="text-base font-semibold text-foreground">
              Delete {selectedCount} selected QR code{selectedCount > 1 ? "s" : ""}?
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              This permanently deletes the selected QR code{selectedCount > 1 ? "s" : ""}, their scan
              history, and any uploaded files. This cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isBusy}
            >
              {busyAction === "delete" ? "Deleting..." : `Delete (${selectedCount})`}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}