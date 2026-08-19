"use client";

import { Placeholder } from "@/components/ui/Placeholder";
import { getQrTypeDefinition } from "@/lib/qr/registry";
import { CONTENT_FORMS } from "@/components/qr/content-forms";
import type { QRType } from "@/types/qr";

interface QRContentPanelProps {
  qrType: QRType;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function QRContentPanel({ qrType, value, onChange }: QRContentPanelProps) {
  const definition = getQrTypeDefinition(qrType);
  const ContentForm = CONTENT_FORMS[qrType];

  if (!ContentForm) {
    // Defense-in-depth only — QRTypeSelector renders not-yet-implemented
    // types (currently 2D Barcode, Location) as disabled with a "Coming
    // soon" badge, so a real user can't reach this. No internal file paths
    // or development terminology, in case it's ever reached some other way.
    return (
      <Placeholder
        label={`${definition.label} — coming soon`}
        description="This QR type isn't available to create yet."
      />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{definition.label} details</h2>
      <ContentForm value={value} onChange={onChange} />
    </div>
  );
}
