"use client";

import { Placeholder } from "@/components/ui/Placeholder";
import { getQrTypeDefinition } from "@/lib/qr/registry";
import type { QRType } from "@/types/qr";

interface QRContentPanelProps {
  qrType: QRType;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

/**
 * Structure-phase skeleton. The real per-type form (driven by the same
 * registry's `fields` schema) is built in Module 2.4; `value`/`onChange`
 * already model the eventual contract (form state keyed by field name) so
 * the shell composition doesn't need to change shape later.
 */
export function QRContentPanel({ qrType }: QRContentPanelProps) {
  const definition = getQrTypeDefinition(qrType);

  return (
    <Placeholder
      label={`${definition.label} content`}
      description="Type-specific fields are implemented in Module 2.4."
    />
  );
}
