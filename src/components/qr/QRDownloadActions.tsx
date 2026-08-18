"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  buildQrPayload,
  renderQrPngDataUrl,
  renderQrSvg,
  slugifyForFilename,
} from "@/lib/qr/render";
import type { DesignConfig } from "@/types/qr-design";
import type { QRType } from "@/types/qr";

interface QRDownloadActionsProps {
  qrType: QRType;
  content: Record<string, unknown>;
  design: DesignConfig;
  name: string;
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Real PNG/SVG download (Module 3.2), reusing the same payload/rendering
 * as `QRPreviewPanel`. Resolution presets, full filename-sanitization
 * policy, logo compositing, and transparent-background export nuances are
 * explicitly Module 3.4's scope — this is a working default, not that
 * module's full implementation. "Save QR" stays disabled until real
 * persistence exists (Module 3.5).
 */
export function QRDownloadActions({ qrType, content, design, name }: QRDownloadActionsProps) {
  const [downloading, setDownloading] = useState<"png" | "svg" | null>(null);
  const payload = buildQrPayload(qrType, content);
  const filename = slugifyForFilename(name);
  const disabled = !payload || downloading !== null;

  const handleDownloadPng = async () => {
    if (!payload) return;
    setDownloading("png");
    try {
      const dataUrl = await renderQrPngDataUrl(payload, design);
      triggerDownload(dataUrl, `${filename}-qr.png`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadSvg = async () => {
    if (!payload) return;
    setDownloading("svg");
    try {
      const svg = await renderQrSvg(payload, design);
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      triggerDownload(url, `${filename}-qr.svg`);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button variant="primary" disabled>
        Save QR
      </Button>
      <Button variant="secondary" disabled={disabled} onClick={handleDownloadPng}>
        {downloading === "png" ? "Preparing PNG..." : "Download PNG"}
      </Button>
      <Button variant="secondary" disabled={disabled} onClick={handleDownloadSvg}>
        {downloading === "svg" ? "Preparing SVG..." : "Download SVG"}
      </Button>
    </div>
  );
}
