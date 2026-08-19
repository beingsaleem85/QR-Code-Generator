"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { SOCIAL_ICON_PLATFORMS, SOCIAL_THEMES } from "@/lib/validation/qr";
import type { QrLink, SocialIconPlatform } from "@/lib/validation/qr";

interface SocialFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

interface SocialIcon {
  platform: SocialIconPlatform;
  url: string;
}

/**
 * The full profile-page experience — title/avatar/description plus both an
 * ordered link list (same shape as `MultiLinkForm`'s) and dedicated
 * platform icons. Plain controlled state, same reasoning as
 * `MultiLinkForm`/`ImagesForm`.
 */
export function SocialForm({ value, onChange }: SocialFormProps) {
  const [title, setTitle] = useState(typeof value.title === "string" ? value.title : "");
  const [avatarUrl, setAvatarUrl] = useState(
    typeof value.avatarUrl === "string" ? value.avatarUrl : "",
  );
  const [description, setDescription] = useState(
    typeof value.description === "string" ? value.description : "",
  );
  const links = (Array.isArray(value.links) ? value.links : []) as QrLink[];
  const icons = (Array.isArray(value.icons) ? value.icons : []) as SocialIcon[];
  const theme = typeof value.theme === "string" ? value.theme : "light";

  const emit = (patch: Record<string, unknown>) => {
    onChange({ title, avatarUrl, description, links, icons, theme, ...patch });
  };

  const addLink = () => emit({ links: [...links, { label: "", url: "" }] });
  const removeLink = (index: number) => emit({ links: links.filter((_, i) => i !== index) });
  const updateLink = (index: number, patch: Partial<QrLink>) => {
    const next = [...links];
    next[index] = { ...next[index], ...patch };
    emit({ links: next });
  };

  const addIcon = () => emit({ icons: [...icons, { platform: "website", url: "" }] });
  const removeIcon = (index: number) => emit({ icons: icons.filter((_, i) => i !== index) });
  const updateIcon = (index: number, patch: Partial<SocialIcon>) => {
    const next = [...icons];
    next[index] = { ...next[index], ...patch };
    emit({ icons: next });
  };

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Page title" htmlFor="social-title">
        <Input
          id="social-title"
          type="text"
          placeholder="My Business"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            emit({ title: event.target.value });
          }}
        />
      </FormField>
      <FormField
        label="Avatar / logo URL"
        htmlFor="social-avatar"
        helperText="Link to an already-hosted image"
      >
        <Input
          id="social-avatar"
          type="text"
          value={avatarUrl}
          onChange={(event) => {
            setAvatarUrl(event.target.value);
            emit({ avatarUrl: event.target.value });
          }}
        />
      </FormField>
      <FormField label="Description" htmlFor="social-description" helperText="Optional">
        <Textarea
          id="social-description"
          rows={2}
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            emit({ description: event.target.value });
          }}
        />
      </FormField>
      <FormField label="Theme" htmlFor="social-theme">
        <Select
          id="social-theme"
          value={theme}
          onChange={(event) => emit({ theme: event.target.value })}
        >
          {SOCIAL_THEMES.map((option) => (
            <option key={option} value={option}>
              {option[0].toUpperCase() + option.slice(1)}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Links</span>
        {links.map((link, index) => (
          <div key={index} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Link {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeLink(index)}
                aria-label={`Remove link ${index + 1}`}
              >
                Remove
              </Button>
            </div>
            <Input
              type="text"
              placeholder="Label"
              value={link.label}
              onChange={(event) => updateLink(index, { label: event.target.value })}
            />
            <Input
              type="text"
              placeholder="https://..."
              value={link.url}
              onChange={(event) => updateLink(index, { url: event.target.value })}
            />
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addLink}>
          Add link
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Social icons</span>
        {icons.map((icon, index) => (
          <div key={index} className="flex items-center gap-2">
            <Select
              value={icon.platform}
              onChange={(event) =>
                updateIcon(index, { platform: event.target.value as SocialIconPlatform })
              }
              aria-label={`Social icon ${index + 1} platform`}
            >
              {SOCIAL_ICON_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform[0].toUpperCase() + platform.slice(1)}
                </option>
              ))}
            </Select>
            <Input
              type="text"
              placeholder="https://..."
              value={icon.url}
              onChange={(event) => updateIcon(index, { url: event.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeIcon(index)}
              aria-label={`Remove social icon ${index + 1}`}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addIcon}>
          Add social icon
        </Button>
      </div>
    </div>
  );
}
