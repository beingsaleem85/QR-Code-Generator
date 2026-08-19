"use client";

import { AccordionItem } from "@/components/ui/AccordionItem";
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

export function QRDesignPanel({ value, onChange }: QRDesignPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Design your QR</h2>
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
      <div className="flex flex-col gap-2">
        <AccordionItem title="Frame">
          <DesignFrameControls
            value={value.frame}
            onChange={(frame) => onChange({ ...value, frame })}
          />
        </AccordionItem>
        <AccordionItem title="Pattern / Shape">
          <DesignPatternControls
            value={value.pattern}
            onChange={(pattern) => onChange({ ...value, pattern })}
          />
        </AccordionItem>
        <AccordionItem title="Eyes">
          <DesignEyeControls value={value.eyes} onChange={(eyes) => onChange({ ...value, eyes })} />
        </AccordionItem>
        <AccordionItem title="Colors" defaultOpen>
          <DesignColorControls
            value={value.colors}
            onChange={(colors) => onChange({ ...value, colors })}
          />
        </AccordionItem>
        <AccordionItem title="Logo">
          <DesignLogoControls
            value={value.logo}
            onChange={(logo) => onChange({ ...value, logo })}
          />
        </AccordionItem>
      </div>
    </div>
  );
}
