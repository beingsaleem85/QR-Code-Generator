"use client";

import { listQrTypeDefinitions } from "@/lib/qr/registry";
import { QR_TYPE_ICONS } from "@/components/qr/qr-type-icons";
import type { QRMode, QRType } from "@/types/qr";

interface QRTypeSelectorProps {
  mode: QRMode;
  selectedType: QRType;
  onTypeChange: (type: QRType) => void;
}

export function QRTypeSelector({ mode, selectedType, onTypeChange }: QRTypeSelectorProps) {
  const types = listQrTypeDefinitions().filter((definition) =>
    mode === "static" ? definition.staticSupport : definition.dynamicSupport,
  );

  return (
    <div
      role="listbox"
      aria-label="QR type"
      className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
    >
      {types.map((definition) => {
        const Icon = QR_TYPE_ICONS[definition.icon];
        const selected = selectedType === definition.key;

        return (
          <button
            key={definition.key}
            type="button"
            role="option"
            aria-selected={selected}
            title={definition.label}
            onClick={() => onTypeChange(definition.key)}
            className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-colors ${
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {Icon ? <Icon size={20} aria-hidden="true" /> : null}
            <span className="text-xs leading-tight font-medium">{definition.label}</span>
          </button>
        );
      })}
    </div>
  );
}
