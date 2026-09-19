"use client";

import { useState, type ChangeEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { uploadQrAsset, AssetValidationError } from "@/lib/qr/asset-upload";
import { setLocalPdfBlobUrl, revokeLocalPdfBlobUrl } from "@/lib/qr/pdf-blob-cache";
import type { PdfQrInput } from "@/lib/validation/qr";

interface PdfFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

/**
 * Uploads straight from the browser to Storage (the signed-in user's own
 * session, Module 1.5's existing owner-only RLS) as soon as a file is
 * picked — there's no separate "upload" step before Save, matching how
 * every other content form already pushes a complete value into the
 * parent's `content` state via `onChange`. Save only writes the resulting
 * reference (`content`, already-validated `pdfQrSchema`), never re-uploads.
 */
export function PdfForm({ value, onChange }: PdfFormProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = value as Partial<PdfQrInput>;

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (current.path) {
      revokeLocalPdfBlobUrl(current.path);
    }

    let localBlobUrl: string | null = null;
    try {
      localBlobUrl = URL.createObjectURL(file);
    } catch {
      // Environments without URL.createObjectURL
    }

    setError(null);
    setUploading(true);
    try {
      const asset = await uploadQrAsset("pdf", file);
      if (localBlobUrl) {
        setLocalPdfBlobUrl(asset.path, localBlobUrl);
      }
      onChange({
        ...current,
        path: asset.path,
        fileName: asset.fileName,
        sizeBytes: asset.sizeBytes,
        mimeType: asset.mimeType,
      });
    } catch (err) {
      setError(err instanceof AssetValidationError ? err.message : "Upload failed — try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <FormField
      label="PDF file"
      htmlFor="pdf-upload"
      helperText="PDF only, up to 20MB. Uploading a new file replaces the current one — the printed QR code keeps working."
      error={error ?? undefined}
    >
      <input
        id="pdf-upload"
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={uploading}
        className="text-sm text-muted-foreground"
      />
      {uploading ? <p className="mt-2 text-xs text-muted-foreground">Uploading…</p> : null}
      {!uploading && current.fileName ? (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
          <span className="truncate text-foreground">{current.fileName}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (current.path) {
                revokeLocalPdfBlobUrl(current.path);
              }
              onChange({});
            }}
            aria-label="Remove PDF"
          >
            Remove
          </Button>
        </div>
      ) : null}

      {current.path ? (
        <div className="mt-3 flex flex-col gap-1">
          <label htmlFor="pdf-public-title" className="text-xs font-medium text-foreground">
            Display name (optional)
          </label>
          <input
            id="pdf-public-title"
            type="text"
            value={typeof current.publicTitle === "string" ? current.publicTitle : ""}
            onChange={(event) => onChange({ ...current, publicTitle: event.target.value })}
            placeholder="e.g. Company Presentation (defaults to document.pdf)"
            className="h-9 rounded-lg border border-border bg-surface px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Auto short URL protected: Visitors see an anonymous short link. Your local filename is never exposed.</span>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={current.openDirectly === true}
            onChange={(event) => onChange({ ...current, openDirectly: event.target.checked })}
          />
          Open PDF directly
        </label>
        <p className="text-xs text-muted-foreground">
          Skip the file page and open this PDF immediately after scanning.
        </p>
        <p className="text-xs text-muted-foreground">
          You can still replace the PDF later without changing your QR code.
        </p>
      </div>
    </FormField>
  );
}
