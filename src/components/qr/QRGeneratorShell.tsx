"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRContentPanel } from "@/components/qr/QRContentPanel";
import { QRDesignPanel } from "@/components/qr/QRDesignPanel";
import { QRDownloadActions } from "@/components/qr/QRDownloadActions";
import { QRModeToggle } from "@/components/qr/QRModeToggle";
import { QRNameField } from "@/components/qr/QRNameField";
import { QRPreviewPanel } from "@/components/qr/QRPreviewPanel";
import { QRTypeSelector } from "@/components/qr/QRTypeSelector";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { AUTH_REQUIRED } from "@/lib/qr/action-types";
import { saveQrCode, updateQrCode } from "@/lib/qr/actions";
import { stashDraft } from "@/lib/qr/draft-storage";
import { getQrTypeDefinition, listQrTypeDefinitions } from "@/lib/qr/registry";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";
import type { DesignConfig } from "@/types/qr-design";
import type { QRMode, QRType } from "@/types/qr";

const INITIAL_TYPE: QRType = "url";

/**
 * Shown under the type selector when the active type is dynamic-only, so a
 * user who lands on one of these (via a click-triggered mode switch, or by
 * opening a saved QR that already has one) understands why Dynamic mode is
 * in effect rather than discovering it only by trial and error.
 */
const DYNAMIC_ONLY_REASON: Partial<Record<QRType, string>> = {
  pdf: "PDF QR codes use Dynamic mode so you can replace the PDF later without changing the printed QR code.",
  images:
    "Image gallery QR codes use Dynamic mode so you can update the photos later without changing the printed QR code.",
  audio:
    "Audio QR codes use Dynamic mode so you can replace the audio file later without changing the printed QR code.",
  app: "App Store / Play Store QR codes use Dynamic mode so they can host a device-aware landing page you can update anytime.",
  social:
    "Social Media QR codes use Dynamic mode so your hosted profile page can be updated anytime without changing the printed QR code.",
  multi_link:
    "Multiple Links QR codes use Dynamic mode so your hosted links page can be updated anytime without changing the printed QR code.",
  menu: "Menu QR codes use Dynamic mode so you can update your menu anytime without changing the printed QR code.",
  feedback:
    "Feedback QR codes use Dynamic mode since they collect submissions through a hosted page.",
};

function firstSupportedType(mode: QRMode): QRType {
  const supported = listQrTypeDefinitions().filter((definition) =>
    mode === "static" ? definition.staticSupport : definition.dynamicSupport,
  );
  return supported[0]?.key ?? INITIAL_TYPE;
}

interface QRGeneratorShellProps {
  /** "edit" adds dirty-tracking, a Save Changes action, and an unsaved-
   * changes browser-close/reload guard — Module 2.7. Defaults to "create"
   * (the original Module 2.4 behavior, used at /qr-generator). */
  variant?: "create" | "edit";
  initialName?: string;
  initialMode?: QRMode;
  initialQrType?: QRType;
  initialContent?: Record<string, unknown>;
  initialDesign?: DesignConfig;
  /** edit-mode only: the saved row this shell is editing — determines
   * whether Save calls `saveQrCode` (create) or `updateQrCode` (this id). */
  qrCodeId?: string;
  /** edit-mode only: the record's current slug, if it's a dynamic QR that's
   * already been saved at least once — Module 3.6. Never generated
   * client-side; a brand-new dynamic QR has none until the first save. */
  initialSlug?: string | null;
}

/**
 * Owns all generator state locally (mode/type/name/content/design) and
 * passes slices down — no global store, per the state-ownership rule in
 * docs/ARCHITECTURE.md. Real persistence (Module 3.5): Save/Save Changes
 * call the real server actions, never a client-supplied user id — the
 * authenticated session on the server is the only source of ownership.
 */
export function QRGeneratorShell({
  variant = "create",
  initialName = "",
  initialMode = "static",
  initialQrType = INITIAL_TYPE,
  initialContent = {},
  initialDesign = DEFAULT_DESIGN_CONFIG,
  qrCodeId,
  initialSlug = null,
}: QRGeneratorShellProps) {
  const router = useRouter();
  const [mode, setMode] = useState<QRMode>(initialMode);
  const [qrType, setQrType] = useState<QRType>(initialQrType);
  const [name, setName] = useState(initialName);
  const [content, setContent] = useState<Record<string, unknown>>(initialContent);
  const [design, setDesign] = useState(initialDesign);
  // Bumped on Reset so QRContentPanel's content form remounts — RHF forms
  // snapshot their `defaultValues` once at mount and don't re-read props
  // afterward, so just resetting `content` state alone wouldn't visually
  // clear an already-mounted form.
  const [contentFormKey, setContentFormKey] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const isDirty =
    variant === "edit" &&
    (name !== initialName ||
      mode !== initialMode ||
      qrType !== initialQrType ||
      JSON.stringify(content) !== JSON.stringify(initialContent) ||
      JSON.stringify(design) !== JSON.stringify(initialDesign));

  useEffect(() => {
    if (!isDirty) return;
    // Covers browser close/reload/typed-URL navigation. In-app SPA
    // navigation (clicking another dashboard link) isn't intercepted yet
    // — that needs a per-navigation confirm hook the App Router doesn't
    // expose simply, disproportionate effort for now.
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

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
      setContentFormKey((key) => key + 1);
    }
  };

  const handleTypeChange = (nextType: QRType) => {
    // Dynamic-only types (PDF, Images, Audio, App, Social, Multi-Link, Menu,
    // Feedback) stay visible in the type selector even while Static is
    // selected (QRTypeSelector) — picking one here switches the mode along
    // with the type, rather than requiring the user to discover and click
    // "Dynamic" first. `firstSupportedType`'s reset path in
    // `handleModeChange` isn't invoked here since the target type is always
    // dynamic-compatible by construction.
    if (!getQrTypeDefinition(nextType).staticSupport && mode === "static") {
      setMode("dynamic");
    }
    setQrType(nextType);
    setContent({});
  };

  const handleReset = () => {
    setMode(initialMode);
    setQrType(initialQrType);
    setName(initialName);
    setContent(initialContent);
    setDesign(initialDesign);
    setContentFormKey((key) => key + 1);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);

    const input = { name, mode, qrType, content, design };
    const result = qrCodeId ? await updateQrCode(qrCodeId, input) : await saveQrCode(input);

    if (!result.data) {
      if (result.error === AUTH_REQUIRED) {
        stashDraft(input);
        router.push(`/login?redirectTo=${encodeURIComponent("/dashboard/qr-codes/new")}`);
        return;
      }
      setSaveError(result.error);
      setSaving(false);
      savingRef.current = false;
      return;
    }

    router.push(`/dashboard/qr-codes/${result.data.id}`);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">
            {variant === "edit" ? "Edit QR Code" : "Create a QR Code"}
          </h1>
          {isDirty ? (
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
              Unsaved changes
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || (variant === "edit" && !isDirty)}
          >
            {saving ? "Saving..." : variant === "edit" ? "Save Changes" : "Save QR"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={saving}>
            Reset
          </Button>
        </div>
      </div>

      {saveError ? <Alert variant="error">{saveError}</Alert> : null}

      <div className="flex flex-wrap items-end gap-4">
        <QRModeToggle mode={mode} onModeChange={handleModeChange} />
        <QRNameField name={name} onNameChange={setName} />
      </div>

      <QRTypeSelector mode={mode} selectedType={qrType} onTypeChange={handleTypeChange} />

      {DYNAMIC_ONLY_REASON[qrType] ? (
        <Alert variant="info">{DYNAMIC_ONLY_REASON[qrType]}</Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <QRContentPanel
            key={contentFormKey}
            qrType={qrType}
            value={content}
            onChange={setContent}
          />
          <QRDesignPanel value={design} onChange={setDesign} />
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <QRPreviewPanel
            qrType={qrType}
            mode={mode}
            content={content}
            design={design}
            slug={initialSlug}
          />
          <QRDownloadActions
            qrType={qrType}
            mode={mode}
            content={content}
            design={design}
            name={name}
            slug={initialSlug}
          />
        </div>
      </div>
    </div>
  );
}
