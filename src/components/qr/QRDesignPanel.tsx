"use client";

import type { ReactNode } from "react";
import { Eye, Frame as FrameIcon, Grid3x3, ImagePlus, Palette } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DesignColorControls,
  DesignEyeControls,
  DesignFrameControls,
  DesignLogoControls,
  DesignPatternControls,
} from "@/components/qr/design-controls";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";
import type { DesignConfig } from "@/types/qr-design";

interface QRDesignPanelProps {
  value: DesignConfig;
  onChange: (value: DesignConfig) => void;
}

/** One always-visible card per control group, matching the reference
 * design's "Frames / Color & Shape / Logo" grouped-section pattern —
 * every option stays discoverable without an extra expand click. */
function DesignSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border border-l-[3px] border-l-primary bg-gradient-to-b from-primary/[0.04] to-transparent p-4">
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-primary to-primary-hover text-primary-foreground shadow-sm">
          <Icon size={17} aria-hidden="true" />
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function QRDesignPanel({ value, onChange }: QRDesignPanelProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-md">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Design your QR</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Customize the frame, pattern, colors, and logo — the preview updates instantly.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT_DESIGN_CONFIG)}
        >
          Reset design
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        <DesignSection icon={FrameIcon} title="Frame">
          <DesignFrameControls
            value={value.frame}
            onChange={(frame) => onChange({ ...value, frame })}
          />
        </DesignSection>
        <DesignSection icon={Grid3x3} title="Pattern / Shape">
          <DesignPatternControls
            value={value.pattern}
            onChange={(pattern) => onChange({ ...value, pattern })}
          />
        </DesignSection>
        <DesignSection icon={Eye} title="Eyes">
          <DesignEyeControls value={value.eyes} onChange={(eyes) => onChange({ ...value, eyes })} />
        </DesignSection>
        <DesignSection icon={Palette} title="Colors">
          <DesignColorControls
            value={value.colors}
            onChange={(colors) => onChange({ ...value, colors })}
          />
        </DesignSection>
        <DesignSection icon={ImagePlus} title="Logo">
          <DesignLogoControls
            value={value.logo}
            onChange={(logo) => onChange({ ...value, logo })}
          />
        </DesignSection>
      </div>
    </div>
  );
}
