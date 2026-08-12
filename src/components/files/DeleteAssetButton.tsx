"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";

interface DeleteAssetButtonProps {
  fileName: string;
  onConfirm: () => void;
}

/**
 * Confirming here only removes the asset from this page's local state —
 * see `FilesView`. Real deletion (Storage object + `qr_assets` row) arrives
 * with Module 3.8; this button is genuinely interactive today so the UX
 * pattern is validated now rather than left as a disabled placeholder.
 */
export function DeleteAssetButton({ fileName, onConfirm }: DeleteAssetButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openDialog = () => dialogRef.current?.showModal();
  const closeDialog = () => dialogRef.current?.close();

  return (
    <>
      <Button variant="secondary" onClick={openDialog} aria-label={`Delete ${fileName}`}>
        Delete
      </Button>

      <dialog
        ref={dialogRef}
        aria-label={`Confirm delete ${fileName}`}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDialog();
        }}
        className="m-auto rounded-xl border border-border bg-surface p-0 shadow-sm backdrop:bg-foreground/40"
      >
        <div className="flex w-80 max-w-[85vw] flex-col gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-foreground">Delete {fileName}?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              This removes it from your file list. This can&apos;t be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onConfirm();
                closeDialog();
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
