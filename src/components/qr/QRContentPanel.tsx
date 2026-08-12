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
    return (
      <Placeholder
        label={`${definition.label} content`}
        description="This QR type needs Supabase Storage or a hosted landing page — its content form arrives with that module (see docs/ARCHITECTURE.md, QR Domain Model)."
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
