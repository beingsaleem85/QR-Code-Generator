"use client";

import { listQrTypeDefinitions } from "@/lib/qr/registry";
import { CONTENT_FORMS } from "@/components/qr/content-forms";
import { QR_TYPE_ICONS } from "@/components/qr/qr-type-icons";
import type { QRMode, QRType } from "@/types/qr";

interface QRTypeSelectorProps {
  mode: QRMode;
  selectedType: QRType;
  onTypeChange: (type: QRType) => void;
}

/**
 * A type is shown while in static mode if it natively supports static, or
 * if it's a real, implemented dynamic-only type — kept discoverable rather
 * than hidden, since selecting it switches the builder to dynamic for you
 * (QRGeneratorShell's `handleTypeChange`). Not-yet-implemented types
 * (`barcode_2d`/`location`) are untouched by this — they're unaffected
 * since both already have `staticSupport: true`.
 */
export function QRTypeSelector({ mode, selectedType, onTypeChange }: QRTypeSelectorProps) {
  const types = listQrTypeDefinitions().filter((definition) => {
    if (mode === "dynamic") return definition.dynamicSupport;
    return (
      definition.staticSupport ||
      (!definition.staticSupport && CONTENT_FORMS[definition.key] != null)
    );
  });

  return (
    <div
      role="listbox"
      aria-label="QR type"
      className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
    >
      {types.map((definition) => {
        const Icon = QR_TYPE_ICONS[definition.icon];
        const selected = selectedType === definition.key;
        const dynamicOnly = !definition.staticSupport;

        return (
          <button
            key={definition.key}
            type="button"
            role="option"
            aria-selected={selected}
            title={definition.label}
            onClick={() => onTypeChange(definition.key)}
            className={`relative flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-colors ${
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {dynamicOnly ? (
              // aria-hidden: purely a visual hint — the option's own
              // accessible name must stay exactly the type label (e.g.
              // "PDF"), not "Dynamic PDF", since every caller (this app's
              // own E2E suite included) queries options by that label.
              <span
                aria-hidden="true"
                className="absolute top-1 right-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[9px] leading-none font-semibold tracking-wide text-muted-foreground uppercase"
              >
                Dynamic
              </span>
            ) : null}
            {Icon ? <Icon size={20} aria-hidden="true" /> : null}
            <span className="text-xs leading-tight font-medium">{definition.label}</span>
          </button>
        );
      })}
    </div>
  );
}
