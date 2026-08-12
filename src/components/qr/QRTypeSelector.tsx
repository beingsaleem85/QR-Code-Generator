"use client";

import { listQrTypeDefinitions } from "@/lib/qr/registry";
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
    <div role="listbox" aria-label="QR type" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {types.map((definition) => (
        <button
          key={definition.key}
          type="button"
          role="option"
          aria-selected={selectedType === definition.key}
          onClick={() => onTypeChange(definition.key)}
          className={`rounded-md border px-3 py-2 text-left text-sm ${
            selectedType === definition.key
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 text-gray-700"
          }`}
        >
          {definition.label}
        </button>
      ))}
    </div>
  );
}
