"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { QrLink } from "@/lib/validation/qr";

interface MultiLinkFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

const EMPTY_LINK: QrLink = { label: "", url: "" };

/**
 * Plain controlled state (no react-hook-form) — same reasoning as
 * `ImagesForm`: an ordered, growable array of sub-fields doesn't fit
 * react-hook-form's single flat-object `watch()` shape cleanly here.
 */
export function MultiLinkForm({ value, onChange }: MultiLinkFormProps) {
  const [title, setTitle] = useState(typeof value.title === "string" ? value.title : "");
  const links = (Array.isArray(value.links) ? value.links : []) as QrLink[];

  const emitTitle = (nextTitle: string) => {
    setTitle(nextTitle);
    onChange({ title: nextTitle, links });
  };

  const emitLinks = (nextLinks: QrLink[]) => {
    onChange({ title, links: nextLinks });
  };

  const addLink = () => emitLinks([...links, { ...EMPTY_LINK }]);
  const removeAt = (index: number) => emitLinks(links.filter((_, i) => i !== index));
  const updateAt = (index: number, patch: Partial<QrLink>) => {
    const next = [...links];
    next[index] = { ...next[index], ...patch };
    emitLinks(next);
  };
  const moveAt = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    [next[index], next[target]] = [next[target], next[index]];
    emitLinks(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Page title" htmlFor="multi-link-title">
        <Input
          id="multi-link-title"
          type="text"
          placeholder="My Links"
          value={title}
          onChange={(event) => emitTitle(event.target.value)}
        />
      </FormField>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Links</span>
        {links.map((link, index) => (
          <div key={index} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">Link {index + 1}</span>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => moveAt(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move link ${index + 1} up`}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => moveAt(index, 1)}
                  disabled={index === links.length - 1}
                  aria-label={`Move link ${index + 1} down`}
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAt(index)}
                  aria-label={`Remove link ${index + 1}`}
                >
                  Remove
                </Button>
              </div>
            </div>
            <Input
              type="text"
              placeholder="Label"
              value={link.label}
              onChange={(event) => updateAt(index, { label: event.target.value })}
            />
            <Input
              type="text"
              placeholder="https://..."
              value={link.url}
              onChange={(event) => updateAt(index, { url: event.target.value })}
            />
          </div>
        ))}
        {links.length === 0 ? <p className="text-xs text-muted-foreground">No links yet.</p> : null}
        <Button type="button" variant="secondary" size="sm" onClick={addLink}>
          Add link
        </Button>
      </div>
    </div>
  );
}
