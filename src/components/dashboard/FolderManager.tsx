"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createFolder, deleteFolder } from "@/lib/folders/actions";
import type { QrFolder } from "@/types/folder";

interface FolderManagerProps {
  folders: QrFolder[];
}

/**
 * Deliberately minimal — create and delete only, no rename. "Optional
 * folders" (master prompt §3.10) is a light organizational aid on top of
 * search/filter, not a full file-manager; a QR code deleted from a folder
 * just becomes unfiled (`ON DELETE SET NULL`), never deleted itself.
 */
export function FolderManager({ folders }: FolderManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const result = await createFolder(name);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setName("");
    router.refresh();
  };

  const openDeleteDialog = (id: string) => {
    setPendingDeleteId(id);
    dialogRef.current?.showModal();
  };
  const closeDeleteDialog = () => {
    dialogRef.current?.close();
    setPendingDeleteId(null);
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    setBusy(true);
    setError(null);
    const result = await deleteFolder(pendingDeleteId);
    setBusy(false);
    closeDeleteDialog();
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const pendingFolder = folders.find((folder) => folder.id === pendingDeleteId);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <p className="text-sm font-medium text-foreground">Folders</p>

      {folders.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {folders.map((folder) => (
            <li key={folder.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-foreground">{folder.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => openDeleteDialog(folder.id)}
                aria-label={`Delete folder ${folder.name}`}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No folders yet.</p>
      )}

      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          type="text"
          placeholder="New folder name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label="New folder name"
        />
        <Button type="submit" variant="secondary" size="sm" disabled={busy || !name.trim()}>
          {busy ? "Adding…" : "Add"}
        </Button>
      </form>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <dialog
        ref={dialogRef}
        aria-label={
          pendingFolder ? `Confirm delete ${pendingFolder.name}` : "Confirm delete folder"
        }
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDeleteDialog();
        }}
        className="m-auto rounded-xl border border-border bg-surface p-0 shadow-sm backdrop:bg-foreground/40"
      >
        <div className="flex w-80 max-w-[85vw] flex-col gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-foreground">
              Delete {pendingFolder?.name ?? "this folder"}?
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              QR codes in this folder become unfiled — they are not deleted.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
