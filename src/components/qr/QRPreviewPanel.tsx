"use client";

import { Placeholder } from "@/components/ui/Placeholder";
import type { DesignConfig } from "@/types/qr-design";
import type { QRMode, QRType } from "@/types/qr";

interface QRPreviewPanelProps {
  qrType: QRType;
  mode: QRMode;
  content: Record<string, unknown>;
  design: DesignConfig;
}

/**
 * Structure-phase skeleton. Real canvas/SVG rendering, debounced updates,
 * and scan-readability warnings are Module 3.3.
 */
export function QRPreviewPanel({}: QRPreviewPanelProps) {
  return (
    <div className="flex aspect-square w-full max-w-xs items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50">
      <Placeholder
        label="QR preview"
        description="Live rendering implemented in Module 3.3."
        className="border-none bg-transparent text-center"
      />
    </div>
  );
}
