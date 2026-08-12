"use client";

import {
  DesignColorControls,
  DesignEyeControls,
  DesignFrameControls,
  DesignLogoControls,
  DesignPatternControls,
} from "@/components/qr/design-controls";
import type { DesignConfig } from "@/types/qr-design";

interface QRDesignPanelProps {
  value: DesignConfig;
  onChange: (value: DesignConfig) => void;
}

/**
 * Structure-phase composition only — an accordion/tabbed layout for these
 * five sections is a Module 2.4 concern. Each section's slice of state
 * (`value.frame`, `value.pattern`, ...) is threaded through independently
 * so the eventual UI can reorder/collapse sections without touching state
 * shape.
 */
export function QRDesignPanel({ value, onChange }: QRDesignPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <DesignFrameControls
        value={value.frame}
        onChange={(frame) => onChange({ ...value, frame })}
      />
      <DesignPatternControls
        value={value.pattern}
        onChange={(pattern) => onChange({ ...value, pattern })}
      />
      <DesignEyeControls value={value.eyes} onChange={(eyes) => onChange({ ...value, eyes })} />
      <DesignColorControls
        value={value.colors}
        onChange={(colors) => onChange({ ...value, colors })}
      />
      <DesignLogoControls value={value.logo} onChange={(logo) => onChange({ ...value, logo })} />
    </div>
  );
}
