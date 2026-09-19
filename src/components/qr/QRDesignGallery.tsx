"use client";

import { useEffect, useState } from "react";
import { DESIGN_PRESETS, type DesignPreset } from "@/lib/qr/design-presets";
import { renderStyledQrSvg } from "@/lib/qr/styled-svg";
import type { DesignConfig } from "@/types/qr-design";

interface QRDesignGalleryProps {
  value: DesignConfig;
  onChange: (value: DesignConfig) => void;
}

const SAMPLE_PAYLOAD = "https://qrforge.space";

// Cache populated thumbnails across component mounts
const PRESET_THUMBNAILS: Record<string, string> = {};

export function QRDesignGallery({ value, onChange }: QRDesignGalleryProps) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>(() => ({ ...PRESET_THUMBNAILS }));

  useEffect(() => {
    if (Object.keys(PRESET_THUMBNAILS).length === DESIGN_PRESETS.length) {
      return;
    }

    let active = true;
    void Promise.all(
      DESIGN_PRESETS.map(async (preset) => {
        if (!PRESET_THUMBNAILS[preset.id]) {
          try {
            const { svg } = await renderStyledQrSvg(SAMPLE_PAYLOAD, {
              ...preset.design,
              logo: { assetUrl: null, sizeRatio: 0.2, whiteMargin: true },
            });
            PRESET_THUMBNAILS[preset.id] = svg;
          } catch {
            // Keep resilient
          }
        }
      }),
    ).then(() => {
      if (active) {
        setThumbnails({ ...PRESET_THUMBNAILS });
      }
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount to populate static preset thumbnails
  }, []);

  // Determine which preset matches current value, if any
  const matchedPreset = DESIGN_PRESETS.find((preset) => {
    return (
      preset.design.pattern.dotStyle === value.pattern.dotStyle &&
      preset.design.eyes.cornerSquareStyle === value.eyes.cornerSquareStyle &&
      preset.design.eyes.cornerDotStyle === value.eyes.cornerDotStyle &&
      preset.design.colors.foreground.toLowerCase() === value.colors.foreground.toLowerCase() &&
      preset.design.frame.style === value.frame.style
    );
  });

  const handleSelectPreset = (preset: DesignPreset) => {
    // Retain existing logo and any existing CTA text if frame style is not changing to none
    onChange({
      ...preset.design,
      frame: {
        ...preset.design.frame,
        ctaText: preset.design.frame.style ? (value.frame.ctaText ?? preset.design.frame.ctaText) : null,
      },
      logo: value.logo,
    });
  };

  return (
    <div className="mb-4">
      <div className="mb-2.5 flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Design Presets
        </label>
        <span className="text-[11px] font-medium text-muted-foreground">
          {matchedPreset ? matchedPreset.name : "Custom Style"}
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label="QR design preset"
        className="grid grid-cols-3 gap-2.5 sm:grid-cols-6"
      >
        {DESIGN_PRESETS.map((preset) => {
          const isSelected = matchedPreset?.id === preset.id;
          const thumbnailSvg = thumbnails[preset.id] || PRESET_THUMBNAILS[preset.id];

          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              title={`${preset.name} — ${preset.description}`}
              onClick={() => handleSelectPreset(preset)}
              className={`group flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 text-center transition-all duration-150 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                  : "border-border bg-surface hover:border-primary/40 hover:shadow-xs"
              }`}
            >
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-background p-1 shadow-2xs">
                {thumbnailSvg ? (
                  <div
                    role="img"
                    aria-label={`${preset.name} preview`}
                    className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: thumbnailSvg }}
                  />
                ) : (
                  <div className="h-full w-full animate-pulse rounded bg-muted/30" />
                )}
              </div>
              <span
                className={`text-[11px] font-medium leading-none ${
                  isSelected ? "text-primary font-semibold" : "text-foreground"
                }`}
              >
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
