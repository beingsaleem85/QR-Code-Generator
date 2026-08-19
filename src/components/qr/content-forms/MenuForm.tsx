"use client";

import { useState, type ChangeEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { uploadQrAsset, AssetValidationError } from "@/lib/qr/asset-upload";
import type { MenuItem } from "@/lib/validation/qr";

interface MenuFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

const EMPTY_ITEM: MenuItem = { name: "", description: "", price: "", category: "" };

/**
 * `category` is a plain free-text field per item, not a nested array of
 * categories — see `menuQrSchema`'s doc comment for why. A photo is
 * optional per item and uploads immediately on selection, same pattern as
 * `PdfForm`/`ImagesForm`.
 */
export function MenuForm({ value, onChange }: MenuFormProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const title = typeof value.title === "string" ? value.title : "";
  const description = typeof value.description === "string" ? value.description : "";
  const items = (Array.isArray(value.items) ? value.items : []) as MenuItem[];

  const emit = (patch: Record<string, unknown>) => {
    onChange({ title, description, items, ...patch });
  };

  const addItem = () => emit({ items: [...items, { ...EMPTY_ITEM }] });
  const removeItem = (index: number) => emit({ items: items.filter((_, i) => i !== index) });
  const updateItem = (index: number, patch: Partial<MenuItem>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    emit({ items: next });
  };

  const handlePhotoChange = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setUploadingIndex(index);
    try {
      const asset = await uploadQrAsset("menu", file);
      updateItem(index, {
        photo: {
          path: asset.path,
          fileName: asset.fileName,
          sizeBytes: asset.sizeBytes,
          mimeType: asset.mimeType,
        },
      });
    } catch (err) {
      setError(err instanceof AssetValidationError ? err.message : "Upload failed — try again.");
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Menu title" htmlFor="menu-title">
        <Input
          id="menu-title"
          type="text"
          placeholder="Dinner Menu"
          value={title}
          onChange={(event) => emit({ title: event.target.value })}
        />
      </FormField>
      <FormField label="Description" htmlFor="menu-description" helperText="Optional">
        <Textarea
          id="menu-description"
          rows={2}
          value={description}
          onChange={(event) => emit({ description: event.target.value })}
        />
      </FormField>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-foreground">Items</span>
        {items.map((item, index) => (
          <div key={index} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                aria-label={`Remove item ${index + 1}`}
              >
                Remove
              </Button>
            </div>
            <Input
              type="text"
              placeholder="Name"
              value={item.name}
              onChange={(event) => updateItem(index, { name: event.target.value })}
            />
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Price"
                value={item.price ?? ""}
                onChange={(event) => updateItem(index, { price: event.target.value })}
              />
              <Input
                type="text"
                placeholder="Category (optional)"
                value={item.category ?? ""}
                onChange={(event) => updateItem(index, { category: event.target.value })}
              />
            </div>
            <Textarea
              rows={2}
              placeholder="Description (optional)"
              value={item.description ?? ""}
              onChange={(event) => updateItem(index, { description: event.target.value })}
            />
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => handlePhotoChange(index, event)}
                disabled={uploadingIndex === index}
                className="text-xs text-muted-foreground"
              />
              {uploadingIndex === index ? (
                <span className="text-xs text-muted-foreground">Uploading…</span>
              ) : item.photo ? (
                <span className="text-xs text-foreground">{item.photo.fileName}</span>
              ) : null}
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addItem}>
          Add item
        </Button>
      </div>
    </div>
  );
}
