"use client";

import { useState, type ChangeEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { uploadQrAsset, AssetValidationError } from "@/lib/qr/asset-upload";
import type { GalleryImage } from "@/lib/validation/qr";

interface ImagesFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

/**
 * Array order *is* gallery order (Module 3.8) — reordering just swaps
 * array positions, no separate index field to keep in sync. Each image
 * uploads independently and immediately, same as `PdfForm`; a failed
 * upload in a batch doesn't block the others.
 */
export function ImagesForm({ value, onChange }: ImagesFormProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const images = (Array.isArray(value.images) ? value.images : []) as GalleryImage[];

  const handleFilesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setError(null);
    setUploading(true);
    try {
      const uploaded: GalleryImage[] = [];
      for (const file of files) {
        const asset = await uploadQrAsset("gallery", file);
        uploaded.push({
          path: asset.path,
          fileName: asset.fileName,
          sizeBytes: asset.sizeBytes,
          mimeType: asset.mimeType,
        });
      }
      onChange({ images: [...images, ...uploaded] });
    } catch (err) {
      setError(err instanceof AssetValidationError ? err.message : "Upload failed — try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (index: number) => {
    onChange({ images: images.filter((_, i) => i !== index) });
  };

  const moveAt = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ images: next });
  };

  const setCaption = (index: number, caption: string) => {
    const next = [...images];
    next[index] = { ...next[index], caption };
    onChange({ images: next });
  };

  return (
    <FormField
      label="Gallery images"
      htmlFor="gallery-upload"
      helperText="PNG, JPEG, WebP, or GIF, up to 10MB each. First image shown first."
      error={error ?? undefined}
    >
      <input
        id="gallery-upload"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        onChange={handleFilesChange}
        disabled={uploading}
        className="text-sm text-muted-foreground"
      />
      {uploading ? <p className="mt-2 text-xs text-muted-foreground">Uploading…</p> : null}

      {images.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {images.map((image, index) => (
            <li
              key={image.path}
              className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-foreground">
                  {image.fileName}
                </span>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveAt(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${image.fileName} up`}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveAt(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label={`Move ${image.fileName} down`}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAt(index)}
                    aria-label={`Remove ${image.fileName}`}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <Input
                type="text"
                placeholder="Optional caption"
                value={image.caption ?? ""}
                onChange={(event) => setCaption(index, event.target.value)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </FormField>
  );
}
