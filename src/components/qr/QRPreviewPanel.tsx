"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { QrPlaceholderGraphic } from "@/components/ui/QrPlaceholderGraphic";
import { buildQrPayload, renderQrSvg } from "@/lib/qr/render";
import type { DesignConfig } from "@/types/qr-design";
import type { QRMode, QRType } from "@/types/qr";

interface QRPreviewPanelProps {
  qrType: QRType;
  mode: QRMode;
  content: Record<string, unknown>;
  design: DesignConfig;
}

/**
 * Real QR rendering (Module 3.2) via the `qrcode` package. Only the two
 * solid colors from `design.colors` are applied — dot/eye shape,
 * gradients, frames, and logo overlay need a custom SVG-matrix renderer
 * and arrive with Module 3.3 ("QR Styling and Live Preview Engine").
 */
export function QRPreviewPanel({ qrType, content, design }: QRPreviewPanelProps) {
  const payload = buildQrPayload(qrType, content);
  // Tracks which payload the rendered markup belongs to, so a stale SVG
  // from a previous (now-invalid) payload never renders — checked at
  // render time below rather than cleared with a synchronous setState
  // inside the effect, which the React Compiler flags as cascading-render-prone.
  const [rendered, setRendered] = useState<{ payload: string; svg: string } | null>(null);

  useEffect(() => {
    if (!payload) return;

    let cancelled = false;
    renderQrSvg(payload, design).then((svg) => {
      if (!cancelled) setRendered({ payload, svg });
    });
    return () => {
      cancelled = true;
    };
    // Only the solid colors currently affect rendering — see the module
    // comment above — so depending on the whole `design` object would
    // re-render on unrelated (not-yet-wired) design changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, design.colors]);

  const svg = rendered?.payload === payload ? rendered.svg : null;

  return (
    <Card className="flex flex-col items-center gap-4 p-6">
      <div className="flex aspect-square w-full max-w-[220px] items-center justify-center rounded-lg border border-border bg-background p-3">
        {svg ? (
          <div
            role="img"
            aria-label="QR code preview"
            className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <QrPlaceholderGraphic size={96} className={payload ? "opacity-100" : "opacity-30"} />
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {payload
          ? "Scan to test — colors reflect your Colors settings; shapes, eyes, and logo overlay arrive in Module 3.3."
          : "Enter content to preview your QR code."}
      </p>
    </Card>
  );
}
