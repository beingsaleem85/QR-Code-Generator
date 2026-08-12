"use client";

import { Card } from "@/components/ui/Card";
import { QrPlaceholderGraphic } from "@/components/ui/QrPlaceholderGraphic";
import type { DesignConfig } from "@/types/qr-design";
import type { QRMode, QRType } from "@/types/qr";

interface QRPreviewPanelProps {
  qrType: QRType;
  mode: QRMode;
  content: Record<string, unknown>;
  design: DesignConfig;
}

function hasContent(content: Record<string, unknown>): boolean {
  return Object.values(content).some((v) => typeof v === "string" && v.trim().length > 0);
}

/**
 * Structure/UI-phase skeleton — the graphic below is a static brand motif,
 * not a rendered QR code. Real canvas/SVG rendering, debounced updates,
 * and scan-readability warnings are Module 3.3.
 */
export function QRPreviewPanel({ content }: QRPreviewPanelProps) {
  const filled = hasContent(content);

  return (
    <Card className="flex flex-col items-center gap-4 p-6">
      <div className="flex aspect-square w-full max-w-[220px] items-center justify-center rounded-lg border border-border bg-background">
        <QrPlaceholderGraphic size={96} className={filled ? "opacity-100" : "opacity-30"} />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {filled
          ? "Live rendering arrives in Module 3.3 — this is a placeholder."
          : "Enter content to preview your QR code."}
      </p>
    </Card>
  );
}
