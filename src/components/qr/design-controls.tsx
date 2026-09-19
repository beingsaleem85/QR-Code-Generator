"use client";

import { useState, useEffect, type ChangeEvent } from "react";
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
          <option value="boxed">Boxed</option>
          <option value="split">Split Card</option>
          <option value="poster">Poster</option>
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
          className="h-10 w-10 cursor-pointer rounded-lg border border-border shadow-sm transition-transform duration-150 hover:scale-105"
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
        <option value="fine-dots">Fine dots</option>
        <option value="micro-dots">Micro dots</option>
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
          <option value="dot">Dot / Circle</option>
        </Select>
      </FormField>
      <FormField label="Corner square color" htmlFor="eye-square-color">
        <input
          id="eye-square-color"
          type="color"
          value={value.cornerSquareColor}
          onChange={(event) => onChange({ ...value, cornerSquareColor: event.target.value })}
          className="h-10 w-10 cursor-pointer rounded-lg border border-border shadow-sm transition-transform duration-150 hover:scale-105"
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
          <option value="dot">Dot / Circle</option>
          <option value="diamond">Diamond</option>
        </Select>
      </FormField>
      <FormField label="Corner dot color" htmlFor="eye-dot-color">
        <input
          id="eye-dot-color"
          type="color"
          value={value.cornerDotColor}
          onChange={(event) => onChange({ ...value, cornerDotColor: event.target.value })}
          className="h-10 w-10 cursor-pointer rounded-lg border border-border shadow-sm transition-transform duration-150 hover:scale-105"
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
            className="h-10 w-10 cursor-pointer rounded-lg border border-border shadow-sm transition-transform duration-150 hover:scale-105"
          />
        </FormField>
        <FormField label="Background" htmlFor="color-background">
          <input
            id="color-background"
            type="color"
            value={value.background}
            onChange={(event) => onChange({ ...value, background: event.target.value })}
            disabled={value.transparentBackground}
            className="h-10 w-10 cursor-pointer rounded-lg border border-border shadow-sm transition-transform duration-150 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          />
        </FormField>
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground select-none">
        <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
          <input
            type="checkbox"
            checked={value.transparentBackground}
            onChange={(event) =>
              onChange({ ...value, transparentBackground: event.target.checked })
            }
            className="peer sr-only"
          />
          <span className="absolute inset-0 rounded-full bg-border transition-colors duration-150 peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-2" />
          <span className="relative h-4 w-4 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform duration-150 peer-checked:translate-x-[18px]" />
        </span>
        Transparent background
      </label>
    </div>
  );
}

interface DesignLogoControlsProps {
  value: DesignConfig["logo"];
  onChange: (value: DesignConfig["logo"]) => void;
}

import {
  BUILTIN_LOGOS,
  getUserScopedLogoCache,
  setUserScopedLogoCache,
  getLegacyUnpartitionedLogos,
  clearLegacyUnpartitionedLogos,
  type LogoItem,
} from "@/lib/qr/logo-library";
import { uploadUserLogoAction } from "@/lib/logos/actions";
import { createClient } from "@/lib/supabase/client";

export function DesignLogoControls({ value, onChange }: DesignLogoControlsProps) {
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedLogos, setSavedLogos] = useState<LogoItem[]>([]);
  const [legacyLogos, setLegacyLogos] = useState<LogoItem[]>(() => getLegacyUnpartitionedLogos());
  const [importingLegacy, setImportingLegacy] = useState(false);
  const [legacyDismissed, setLegacyDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return;
    }
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!active) return;
        const user = data?.user;
        if (user) {
          setUserId(user.id);
          const cached = getUserScopedLogoCache(user.id);
          if (cached.length > 0) {
            setSavedLogos(cached);
          }
          const { data: assets } = await supabase
            .from("qr_assets")
            .select("id, path, created_at")
            .eq("asset_type", "logo")
            .eq("bucket", "qr-logos")
            .order("created_at", { ascending: false });
          if (!active || !assets) return;
          const items: LogoItem[] = [];
          for (const row of assets) {
            const { data: signed } = await supabase.storage
              .from("qr-logos")
              .createSignedUrl(row.path, 60 * 60 * 24);
            if (signed?.signedUrl) {
              const rawName = row.path.split("/").pop()?.replace(/\.[^/.]+$/, "") ?? "Logo";
              items.push({
                id: row.id,
                name: rawName.replace(/[-_]/g, " "),
                dataUrl: signed.signedUrl,
                isCustom: true,
              });
            }
          }
          if (active) {
            setSavedLogos(items);
            setUserScopedLogoCache(user.id, items);
          }
        } else {
          setUserId(null);
          setSavedLogos([]);
        }
      } catch {
        // Handled gracefully in unconfigured / test environments
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    try {
      const assetUrl = await readLogoFile(file);
      onChange({ ...value, assetUrl });

      const tempId = `custom-${Date.now()}`;
      const tempItem: LogoItem = {
        id: tempId,
        name: file.name.replace(/\.[^/.]+$/, ""),
        dataUrl: assetUrl,
        isCustom: true,
      };
      setSavedLogos((prev) => [tempItem, ...prev.filter((p) => p.dataUrl !== assetUrl)]);

      const formData = new FormData();
      formData.append("file", file);
      void uploadUserLogoAction(formData).then((res) => {
        if (res.data && userId) {
          setSavedLogos((prev) => {
            const updated = [
              {
                id: res.data!.id,
                name: res.data!.name,
                dataUrl: res.data!.url || assetUrl,
                isCustom: true,
              },
              ...prev.filter((p) => p.id !== tempId && p.dataUrl !== assetUrl),
            ];
            setUserScopedLogoCache(userId, updated);
            return updated;
          });
        }
      });
    } catch {
      setError("Couldn't use that image — try a different file.");
    }
  };

  const handleImportLegacyLogos = async () => {
    if (!userId || legacyLogos.length === 0) return;
    setImportingLegacy(true);
    setError(null);
    try {
      for (const item of legacyLogos) {
        const isDuplicate = savedLogos.some(
          (s) => s.name === item.name || s.dataUrl === item.dataUrl,
        );
        if (isDuplicate) continue;

        const res = await fetch(item.dataUrl);
        const blob = await res.blob();
        const ext = blob.type.split("/")[1] || "png";
        const file = new File([blob], `${item.name || "logo"}.${ext}`, { type: blob.type });

        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await uploadUserLogoAction(formData);
        if (uploadRes.data) {
          const newLogo: LogoItem = {
            id: uploadRes.data.id,
            name: uploadRes.data.name,
            dataUrl: uploadRes.data.url,
            isCustom: true,
          };
          setSavedLogos((prev) => {
            const updated = [newLogo, ...prev.filter((p) => p.id !== newLogo.id)];
            setUserScopedLogoCache(userId, updated);
            return updated;
          });
        }
      }
      setLegacyDismissed(true);
    } catch {
      setError("Failed to import legacy logos. You can still upload them individually.");
    } finally {
      setImportingLegacy(false);
    }
  };

  const handleClearLegacy = () => {
    clearLegacyUnpartitionedLogos();
    setLegacyLogos([]);
  };

  const handleSelectLogo = (dataUrl: string | null) => {
    onChange({ ...value, assetUrl: dataUrl });
  };

  return (
    <div className="flex flex-col gap-4">
      <FormField
        label="Logo"
        htmlFor="logo-upload"
        helperText="Upload your custom logo or choose from the library below."
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

      {userId && legacyLogos.length > 0 && !legacyDismissed ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
          <p className="font-semibold text-primary">
            Found {legacyLogos.length} saved logo{legacyLogos.length > 1 ? "s" : ""} on this device
          </p>
          <p className="mt-1 text-muted-foreground">
            These logos were saved in a previous session. Would you like to import them into your permanent account gallery?
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleImportLegacyLogos}
              disabled={importingLegacy}
            >
              {importingLegacy ? "Importing…" : "Import to my account"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setLegacyDismissed(true)}
            >
              Keep on device
            </Button>
            <button
              type="button"
              onClick={handleClearLegacy}
              className="text-[11px] text-muted-foreground underline hover:text-foreground"
            >
              Clear device copy
            </button>
          </div>
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-xs font-semibold text-foreground">
          Logo Library
        </label>
        <div
          role="radiogroup"
          aria-label="Logo selection"
          className="grid grid-cols-5 gap-2 sm:grid-cols-8"
        >
          {/* Clear / No Logo Option */}
          <button
            type="button"
            role="radio"
            aria-checked={!value.assetUrl}
            aria-label="No logo"
            title="No logo"
            onClick={() => handleSelectLogo(null)}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-all ${
              !value.assetUrl
                ? "border-primary bg-primary/10 text-primary shadow-xs"
                : "border-border bg-background text-muted-foreground hover:border-primary/40"
            }`}
          >
            <span className="text-xs font-bold">✕</span>
          </button>

          {/* User Saved Uploads */}
          {savedLogos.map((item) => {
            const isSelected = value.assetUrl === item.dataUrl;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={item.name}
                title={item.name}
                onClick={() => handleSelectLogo(item.dataUrl)}
                className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border-2 p-1 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.dataUrl}
                  alt={item.name}
                  className="h-full w-full object-contain"
                />
              </button>
            );
          })}

          {/* Built-in Safe Icons */}
          {BUILTIN_LOGOS.map((item) => {
            const isSelected = value.assetUrl === item.dataUrl;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={item.name}
                title={item.name}
                onClick={() => handleSelectLogo(item.dataUrl)}
                className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border-2 p-1.5 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.dataUrl}
                  alt={item.name}
                  className="h-full w-full object-contain"
                />
              </button>
            );
          })}
        </div>
      </div>

      {value.assetUrl ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.assetUrl}
            alt="Logo preview"
            className="h-10 w-10 rounded border border-border object-contain"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleSelectLogo(null)}
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

      <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground select-none">
        <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
          <input
            type="checkbox"
            checked={value.whiteMargin}
            onChange={(event) => onChange({ ...value, whiteMargin: event.target.checked })}
            className="peer sr-only"
          />
          <span className="absolute inset-0 rounded-full bg-border transition-colors duration-150 peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-2" />
          <span className="relative h-4 w-4 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform duration-150 peer-checked:translate-x-[18px]" />
        </span>
        White margin behind logo
      </label>
    </div>
  );
}
