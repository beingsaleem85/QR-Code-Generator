"use client";

import { Card } from "@/components/ui/Card";
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
        <svg
          width="96"
          height="96"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={filled ? "opacity-100" : "opacity-30"}
        >
          <rect x="2" y="2" width="7" height="7" rx="1.5" fill="var(--color-primary)" />
          <rect
            x="15"
            y="2"
            width="7"
            height="7"
            rx="1.5"
            fill="var(--color-primary)"
            opacity="0.55"
          />
          <rect
            x="2"
            y="15"
            width="7"
            height="7"
            rx="1.5"
            fill="var(--color-primary)"
            opacity="0.55"
          />
          <rect x="15" y="15" width="3" height="3" rx="1" fill="var(--color-primary)" />
          <rect
            x="19"
            y="15"
            width="3"
            height="3"
            rx="1"
            fill="var(--color-primary)"
            opacity="0.55"
          />
          <rect
            x="15"
            y="19"
            width="3"
            height="3"
            rx="1"
            fill="var(--color-primary)"
            opacity="0.55"
          />
        </svg>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {filled
          ? "Live rendering arrives in Module 3.3 — this is a placeholder."
          : "Enter content to preview your QR code."}
      </p>
    </Card>
  );
}
