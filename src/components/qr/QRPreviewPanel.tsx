"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { QrPlaceholderGraphic } from "@/components/ui/QrPlaceholderGraphic";
import { buildQrPayload, resolveEncodedPayload } from "@/lib/qr/render";
import { renderStyledQrSvg } from "@/lib/qr/styled-svg";
import type { DesignConfig } from "@/types/qr-design";
import type { QRMode, QRType } from "@/types/qr";

interface QRPreviewPanelProps {
  qrType: QRType;
  mode: QRMode;
  content: Record<string, unknown>;
  design: DesignConfig;
  /** The saved record's slug (edit mode only) — a dynamic QR has no
   * scannable image until it's been saved once and issued one. */
  slug?: string | null;
  /** The saved record's opaque public-viewer token (edit mode only) — see
   * `resolveEncodedPayload`'s doc comment. */
  publicToken?: string | null;
}

/** Debounces re-render on rapid input (typing, slider drag) — the Preview
 * Performance rule from Module 3.3. Form inputs stay responsive since this
 * only delays the (separate, async) render effect, never the input itself. */
const RENDER_DEBOUNCE_MS = 200;

interface RenderedState {
  payload: string;
  svg: string;
  warnings: string[];
}

/** Real, fully-styled QR rendering (Module 3.3) — pattern/eyes/gradient/logo/frame, not just solid colors. */
export function QRPreviewPanel({
  qrType,
  mode,
  content,
  design,
  slug,
  publicToken,
}: QRPreviewPanelProps) {
  const payload = resolveEncodedPayload(mode, qrType, content, slug, publicToken);
  // Content is valid (so Save will succeed) but a dynamic QR has no slug
  // yet — distinct from "nothing entered" so the empty state explains why.
  const pendingFirstSave = mode === "dynamic" && !slug && !!buildQrPayload(qrType, content);
  // Tracks which payload the rendered markup belongs to, so a stale SVG
  // never shows for the wrong content — checked at render time rather
  // than cleared with a synchronous setState inside the effect (the React
  // Compiler flags that as cascading-render-prone).
  const [rendered, setRendered] = useState<RenderedState | null>(null);

  useEffect(() => {
    if (!payload) return;

    const timeoutId = setTimeout(() => {
      renderStyledQrSvg(payload, design).then(({ svg, warnings }) => {
        setRendered({ payload, svg, warnings });
      });
    }, RENDER_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
    // design is destructured per-slice so this only re-fires when a slice
    // that actually affects rendering changes, not on every design update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, design.colors, design.pattern, design.eyes, design.logo, design.frame]);

  const current = rendered?.payload === payload ? rendered : null;

  return (
    <Card className="rounded-2xl flex flex-col items-center gap-4 p-6">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Preview</h2>
        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          Live
        </span>
      </div>
      <div className="relative flex aspect-square w-full max-w-[240px] items-center justify-center">
        <div aria-hidden="true" className="absolute inset-4 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-border bg-background p-4 shadow-lg">
          {current ? (
            <div
              role="img"
              aria-label="QR code preview"
              className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: current.svg }}
            />
          ) : (
            <QrPlaceholderGraphic size={96} className={payload ? "opacity-100" : "opacity-30"} />
          )}
        </div>
      </div>

      {!payload ? (
        <p className="text-center text-xs text-muted-foreground">
          {pendingFirstSave
            ? "Save to generate your scannable dynamic QR code."
            : "Enter content to preview your QR code."}
        </p>
      ) : current && current.warnings.length > 0 ? (
        <ul className="flex flex-col gap-1 text-center text-xs text-warning">
          {current.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-xs text-muted-foreground">Scan to test.</p>
      )}
    </Card>
  );
}
