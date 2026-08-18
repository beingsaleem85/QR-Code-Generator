"use client";

import { useState, type ChangeEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { uploadQrAsset, AssetValidationError } from "@/lib/qr/asset-upload";
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

    setError(null);
    setUploading(true);
    try {
      const asset = await uploadQrAsset("pdf", file);
      onChange({
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
            onClick={() => onChange({})}
            aria-label="Remove PDF"
          >
            Remove
          </Button>
        </div>
      ) : null}
    </FormField>
  );
}
