"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { buildQrPayload, slugifyForFilename } from "@/lib/qr/render";
import { renderStyledQrPngDataUrl, renderStyledQrSvg } from "@/lib/qr/styled-svg";
import type { DesignConfig } from "@/types/qr-design";
import type { QRType } from "@/types/qr";

interface QRDownloadActionsProps {
  qrType: QRType;
  content: Record<string, unknown>;
  design: DesignConfig;
  name: string;
}

const PNG_SIZE_OPTIONS = [512, 1024, 2048] as const;
type PngSize = (typeof PNG_SIZE_OPTIONS)[number];

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Real PNG/SVG download (Module 3.2), with the full download/export
 * experience (Module 3.4) built on top: PNG resolution presets, and
 * `slugifyForFilename()`'s complete sanitization policy. SVG has no size
 * selector — it's vector, so it's already crisp at any size. "Save QR"
 * stays disabled until real persistence exists (Module 3.5).
 */
export function QRDownloadActions({ qrType, content, design, name }: QRDownloadActionsProps) {
  const [downloading, setDownloading] = useState<"png" | "svg" | null>(null);
  const [pngSize, setPngSize] = useState<PngSize>(1024);
  const payload = buildQrPayload(qrType, content);
  const filename = slugifyForFilename(name);
  const disabled = !payload || downloading !== null;

  const handleDownloadPng = async () => {
    if (!payload) return;
    setDownloading("png");
    try {
      const { dataUrl } = await renderStyledQrPngDataUrl(payload, design, pngSize);
      triggerDownload(dataUrl, `${filename}-qr.png`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadSvg = async () => {
    if (!payload) return;
    setDownloading("svg");
    try {
      const { svg } = await renderStyledQrSvg(payload, design);
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      triggerDownload(url, `${filename}-qr.svg`);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" disabled>
        Save QR
      </Button>

      <FormField label="PNG size" htmlFor="png-size">
        <Select
          id="png-size"
          value={String(pngSize)}
          onChange={(event) => setPngSize(Number(event.target.value) as PngSize)}
        >
          {PNG_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </Select>
      </FormField>
      <Button variant="secondary" disabled={disabled} onClick={handleDownloadPng}>
        {downloading === "png" ? "Preparing PNG..." : "Download PNG"}
      </Button>

      <Button variant="secondary" disabled={disabled} onClick={handleDownloadSvg}>
        {downloading === "svg" ? "Preparing SVG..." : "Download SVG"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        SVG is vector — always crisp at any size.
      </p>
    </div>
  );
}
