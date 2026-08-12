"use client";

import { useState } from "react";
import { QRContentPanel } from "@/components/qr/QRContentPanel";
import { QRDesignPanel } from "@/components/qr/QRDesignPanel";
import { QRDownloadActions } from "@/components/qr/QRDownloadActions";
import { QRModeToggle } from "@/components/qr/QRModeToggle";
import { QRNameField } from "@/components/qr/QRNameField";
import { QRPreviewPanel } from "@/components/qr/QRPreviewPanel";
import { QRTypeSelector } from "@/components/qr/QRTypeSelector";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";
import type { QRMode, QRType } from "@/types/qr";

/**
 * Structure-phase composition: wires the generator sub-components together
 * with local-only state so the shell renders and behaves coherently
 * end-to-end. No validation, persistence, or rendering — those are
 * Module 2.4 (UI) and Module 3.2+ (features). State ownership here is the
 * thing this module is actually testing: content/design/preview all derive
 * from one local state tree owned by the shell, not scattered across
 * children or a global store (see docs/ARCHITECTURE.md, "State Ownership").
 */
export function QRGeneratorShell() {
  const [mode, setMode] = useState<QRMode>("static");
  const [qrType, setQrType] = useState<QRType>("url");
  const [name, setName] = useState("");
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [design, setDesign] = useState(DEFAULT_DESIGN_CONFIG);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <QRModeToggle mode={mode} onModeChange={setMode} />
        <QRNameField name={name} onNameChange={setName} />
      </div>

      <QRTypeSelector mode={mode} selectedType={qrType} onTypeChange={setQrType} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <QRContentPanel qrType={qrType} value={content} onChange={setContent} />
          <QRDesignPanel value={design} onChange={setDesign} />
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <QRPreviewPanel qrType={qrType} mode={mode} content={content} design={design} />
          <QRDownloadActions />
        </div>
      </div>
    </div>
  );
}
