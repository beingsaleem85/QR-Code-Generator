"use client";

import { AccordionItem } from "@/components/ui/AccordionItem";
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

export function QRDesignPanel({ value, onChange }: QRDesignPanelProps) {
  return (
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
        <DesignLogoControls value={value.logo} onChange={(logo) => onChange({ ...value, logo })} />
      </AccordionItem>
    </div>
  );
}
