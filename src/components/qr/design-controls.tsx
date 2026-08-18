"use client";

import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { readLogoFile } from "@/lib/qr/logo";
import type { DesignConfig } from "@/types/qr-design";

interface DesignFrameControlsProps {
  value: DesignConfig["frame"];
  onChange: (value: DesignConfig["frame"]) => void;
}

export function DesignFrameControls({ value, onChange }: DesignFrameControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      <FormField label="Frame style" htmlFor="frame-style">
        <Select
          id="frame-style"
          value={value.style ?? "none"}
          onChange={(event) =>
            onChange({ ...value, style: event.target.value === "none" ? null : event.target.value })
          }
        >
          <option value="none">None</option>
          <option value="simple">Simple</option>
          <option value="rounded">Rounded</option>
          <option value="badge">Badge</option>
        </Select>
      </FormField>
      <FormField label="CTA text" htmlFor="frame-cta" helperText="e.g. Scan Me">
        <Input
          id="frame-cta"
          type="text"
          value={value.ctaText ?? ""}
          onChange={(event) => onChange({ ...value, ctaText: event.target.value || null })}
        />
      </FormField>
      <FormField label="Frame color" htmlFor="frame-color">
        <input
          id="frame-color"
          type="color"
          value={value.color}
          onChange={(event) => onChange({ ...value, color: event.target.value })}
          className="h-10 w-16 rounded-lg border border-border"
        />
      </FormField>
    </div>
  );
}

interface DesignPatternControlsProps {
  value: DesignConfig["pattern"];
  onChange: (value: DesignConfig["pattern"]) => void;
}

export function DesignPatternControls({ value, onChange }: DesignPatternControlsProps) {
  return (
    <FormField label="Dot style" htmlFor="pattern-dot-style">
      <Select
        id="pattern-dot-style"
        value={value.dotStyle}
        onChange={(event) => onChange({ dotStyle: event.target.value })}
      >
        <option value="square">Square</option>
        <option value="dots">Dots</option>
        <option value="rounded">Rounded</option>
      </Select>
    </FormField>
  );
}

interface DesignEyeControlsProps {
  value: DesignConfig["eyes"];
  onChange: (value: DesignConfig["eyes"]) => void;
}

export function DesignEyeControls({ value, onChange }: DesignEyeControlsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="Corner square style" htmlFor="eye-square-style">
        <Select
          id="eye-square-style"
          value={value.cornerSquareStyle}
          onChange={(event) => onChange({ ...value, cornerSquareStyle: event.target.value })}
        >
          <option value="square">Square</option>
          <option value="rounded">Rounded</option>
          <option value="dot">Dot</option>
        </Select>
      </FormField>
      <FormField label="Corner square color" htmlFor="eye-square-color">
        <input
          id="eye-square-color"
          type="color"
          value={value.cornerSquareColor}
          onChange={(event) => onChange({ ...value, cornerSquareColor: event.target.value })}
          className="h-10 w-16 rounded-lg border border-border"
        />
      </FormField>
      <FormField label="Corner dot style" htmlFor="eye-dot-style">
        <Select
          id="eye-dot-style"
          value={value.cornerDotStyle}
          onChange={(event) => onChange({ ...value, cornerDotStyle: event.target.value })}
        >
          <option value="square">Square</option>
          <option value="rounded">Rounded</option>
          <option value="dot">Dot</option>
        </Select>
      </FormField>
      <FormField label="Corner dot color" htmlFor="eye-dot-color">
        <input
          id="eye-dot-color"
          type="color"
          value={value.cornerDotColor}
          onChange={(event) => onChange({ ...value, cornerDotColor: event.target.value })}
          className="h-10 w-16 rounded-lg border border-border"
        />
      </FormField>
    </div>
  );
}

interface DesignColorControlsProps {
  value: DesignConfig["colors"];
  onChange: (value: DesignConfig["colors"]) => void;
}

export function DesignColorControls({ value, onChange }: DesignColorControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Foreground" htmlFor="color-foreground">
          <input
            id="color-foreground"
            type="color"
            value={value.foreground}
            onChange={(event) => onChange({ ...value, foreground: event.target.value })}
            className="h-10 w-16 rounded-lg border border-border"
          />
        </FormField>
        <FormField label="Background" htmlFor="color-background">
          <input
            id="color-background"
            type="color"
            value={value.background}
            onChange={(event) => onChange({ ...value, background: event.target.value })}
            disabled={value.transparentBackground}
            className="h-10 w-16 rounded-lg border border-border disabled:opacity-50"
          />
        </FormField>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={value.transparentBackground}
          onChange={(event) => onChange({ ...value, transparentBackground: event.target.checked })}
        />
        Transparent background
      </label>
    </div>
  );
}

interface DesignLogoControlsProps {
  value: DesignConfig["logo"];
  onChange: (value: DesignConfig["logo"]) => void;
}

export function DesignLogoControls({ value, onChange }: DesignLogoControlsProps) {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input so choosing the same file again still fires onChange.
    event.target.value = "";
    if (!file) return;

    setError(null);
    try {
      const assetUrl = await readLogoFile(file);
      onChange({ ...value, assetUrl });
    } catch {
      setError("Couldn't use that image — try a different file.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FormField
        label="Logo"
        htmlFor="logo-upload"
        helperText="Composited into the QR's preview and downloads. Only saved once you save this QR code."
        error={error ?? undefined}
      >
        <input
          id="logo-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="text-sm text-muted-foreground"
        />
      </FormField>
      {value.assetUrl ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- a locally-generated data URL, not a remote/optimizable image; matches Avatar.tsx's established pattern for this kind of small user-supplied image preview. */}
          <img
            src={value.assetUrl}
            alt="Logo preview"
            className="h-10 w-10 rounded border border-border object-contain"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...value, assetUrl: null })}
          >
            Remove logo
          </Button>
        </div>
      ) : null}
      <FormField label="Logo size" htmlFor="logo-size">
        <input
          id="logo-size"
          type="range"
          min={0.1}
          max={0.3}
          step={0.01}
          value={value.sizeRatio}
          onChange={(event) => onChange({ ...value, sizeRatio: Number(event.target.value) })}
        />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={value.whiteMargin}
          onChange={(event) => onChange({ ...value, whiteMargin: event.target.checked })}
        />
        White margin behind logo
      </label>
    </div>
  );
}
