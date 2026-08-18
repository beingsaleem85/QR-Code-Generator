"use client";

import { useState, type ChangeEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { uploadQrAsset, AssetValidationError } from "@/lib/qr/asset-upload";
import type { AudioQrInput } from "@/lib/validation/qr";

interface AudioFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function AudioForm({ value, onChange }: AudioFormProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = value as Partial<AudioQrInput>;

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const asset = await uploadQrAsset("audio", file);
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
    <div className="flex flex-col gap-4">
      <FormField
        label="Audio file"
        htmlFor="audio-upload"
        helperText="MP3, M4A, WAV, or OGG, up to 15MB. Uploading a new file replaces the current one."
        error={error ?? undefined}
      >
        <input
          id="audio-upload"
          type="file"
          accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg"
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
              onClick={() => onChange({ title: current.title, description: current.description })}
              aria-label="Remove audio file"
            >
              Remove
            </Button>
          </div>
        ) : null}
      </FormField>

      <FormField label="Title" htmlFor="audio-title" helperText="Optional">
        <Input
          id="audio-title"
          type="text"
          value={current.title ?? ""}
          onChange={(event) => onChange({ ...current, title: event.target.value })}
        />
      </FormField>

      <FormField label="Description" htmlFor="audio-description" helperText="Optional">
        <Textarea
          id="audio-description"
          value={current.description ?? ""}
          onChange={(event) => onChange({ ...current, description: event.target.value })}
        />
      </FormField>
    </div>
  );
}
