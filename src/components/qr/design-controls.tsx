"use client";

import { Placeholder } from "@/components/ui/Placeholder";
import type { DesignConfig } from "@/types/qr-design";

interface DesignFrameControlsProps {
  value: DesignConfig["frame"];
  onChange: (value: DesignConfig["frame"]) => void;
}

export function DesignFrameControls({}: DesignFrameControlsProps) {
  return <Placeholder label="Frame" description="Style, CTA text/font, and frame color." />;
}

interface DesignPatternControlsProps {
  value: DesignConfig["pattern"];
  onChange: (value: DesignConfig["pattern"]) => void;
}

export function DesignPatternControls({}: DesignPatternControlsProps) {
  return <Placeholder label="Pattern / Shape" description="Dot style for QR modules." />;
}

interface DesignEyeControlsProps {
  value: DesignConfig["eyes"];
  onChange: (value: DesignConfig["eyes"]) => void;
}

export function DesignEyeControls({}: DesignEyeControlsProps) {
  return <Placeholder label="Eyes" description="Corner square and corner dot style/color." />;
}

interface DesignColorControlsProps {
  value: DesignConfig["colors"];
  onChange: (value: DesignConfig["colors"]) => void;
}

export function DesignColorControls({}: DesignColorControlsProps) {
  return (
    <Placeholder label="Colors" description="Foreground/background, transparency, and gradient." />
  );
}

interface DesignLogoControlsProps {
  value: DesignConfig["logo"];
  onChange: (value: DesignConfig["logo"]) => void;
}

export function DesignLogoControls({}: DesignLogoControlsProps) {
  return <Placeholder label="Logo" description="Upload, preview, sizing, and margin." />;
}
