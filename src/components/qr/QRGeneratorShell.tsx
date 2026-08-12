"use client";

import { useState } from "react";
import { QRContentPanel } from "@/components/qr/QRContentPanel";
import { QRDesignPanel } from "@/components/qr/QRDesignPanel";
import { QRDownloadActions } from "@/components/qr/QRDownloadActions";
import { QRModeToggle } from "@/components/qr/QRModeToggle";
import { QRNameField } from "@/components/qr/QRNameField";
import { QRPreviewPanel } from "@/components/qr/QRPreviewPanel";
import { QRTypeSelector } from "@/components/qr/QRTypeSelector";
import { Button } from "@/components/ui/Button";
import { listQrTypeDefinitions } from "@/lib/qr/registry";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";
import type { QRMode, QRType } from "@/types/qr";

const INITIAL_TYPE: QRType = "url";

function firstSupportedType(mode: QRMode): QRType {
  const supported = listQrTypeDefinitions().filter((definition) =>
    mode === "static" ? definition.staticSupport : definition.dynamicSupport,
  );
  return supported[0]?.key ?? INITIAL_TYPE;
}

/**
 * UI-phase composition (Module 2.4): the generator shell owns all state
 * locally (mode/type/name/content/design) and passes slices down — no
 * global store, per the state-ownership rule in docs/ARCHITECTURE.md.
 * Content forms and design controls are now real (React Hook Form + Zod
 * for the 9 implemented types; working accordion for design), but nothing
 * here persists, validates server-side, or renders a real QR yet — that's
 * Phase 3.
 */
export function QRGeneratorShell() {
  const [mode, setMode] = useState<QRMode>("static");
  const [qrType, setQrType] = useState<QRType>(INITIAL_TYPE);
  const [name, setName] = useState("");
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [design, setDesign] = useState(DEFAULT_DESIGN_CONFIG);

  const handleModeChange = (nextMode: QRMode) => {
    setMode(nextMode);
    const supportsCurrentType = listQrTypeDefinitions().some(
      (definition) =>
        definition.key === qrType &&
        (nextMode === "static" ? definition.staticSupport : definition.dynamicSupport),
    );
    if (!supportsCurrentType) {
      setQrType(firstSupportedType(nextMode));
      setContent({});
    }
  };

  const handleTypeChange = (nextType: QRType) => {
    setQrType(nextType);
    setContent({});
  };

  const handleReset = () => {
    setMode("static");
    setQrType(INITIAL_TYPE);
    setName("");
    setContent({});
    setDesign(DEFAULT_DESIGN_CONFIG);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">Create a QR Code</h1>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <QRModeToggle mode={mode} onModeChange={handleModeChange} />
        <QRNameField name={name} onNameChange={setName} />
      </div>

      <QRTypeSelector mode={mode} selectedType={qrType} onTypeChange={handleTypeChange} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <QRContentPanel qrType={qrType} value={content} onChange={setContent} />
          <QRDesignPanel value={design} onChange={setDesign} />
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <QRPreviewPanel qrType={qrType} mode={mode} content={content} design={design} />
          <QRDownloadActions />
        </div>
      </div>
    </div>
  );
}
