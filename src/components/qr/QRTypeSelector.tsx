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
 * (`barcode_2d`/`location` — no defined product spec exists for either
 * one, see docs/PRODUCTION_REMEDIATION_PROGRESS.md Step 4) still appear
 * here for the same reason `/qr-types` shows them in its "Coming soon"
 * section rather than hiding them outright, but are rendered disabled with
 * a "Coming soon" badge instead of being clickable — selecting either used
 * to fall through to QRContentPanel's generic placeholder.
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
      className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
    >
      {types.map((definition) => {
        const Icon = QR_TYPE_ICONS[definition.icon];
        const selected = selectedType === definition.key;
        const dynamicOnly = !definition.staticSupport;
        const comingSoon = CONTENT_FORMS[definition.key] == null;

        return (
          <button
            key={definition.key}
            type="button"
            role="option"
            aria-selected={selected}
            aria-disabled={comingSoon}
            disabled={comingSoon}
            title={comingSoon ? `${definition.label} — coming soon` : definition.label}
            onClick={comingSoon ? undefined : () => onTypeChange(definition.key)}
            className={`group relative flex flex-col items-center gap-2 rounded-xl border px-2 py-3.5 text-center shadow-sm transition-all duration-150 ${
              comingSoon
                ? "cursor-not-allowed border-border bg-surface text-muted-foreground opacity-60 shadow-none"
                : selected
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-surface text-foreground hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            }`}
          >
            {comingSoon ? (
              <span
                aria-hidden="true"
                className="absolute top-1 right-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[9px] leading-none font-semibold tracking-wide text-muted-foreground uppercase"
              >
                Coming soon
              </span>
            ) : dynamicOnly ? (
              // aria-hidden: purely a visual hint — the option's own
              // accessible name must stay exactly the type label (e.g.
              // "PDF"), not "Dynamic PDF", since every caller (this app's
              // own E2E suite included) queries options by that label.
              <span
                aria-hidden="true"
                className={`absolute top-1 right-1 rounded-full border px-1.5 py-0.5 text-[9px] leading-none font-semibold tracking-wide uppercase ${
                  selected
                    ? "border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                Dynamic
              </span>
            ) : null}
            {Icon ? (
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 ${
                  selected
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "bg-primary/8 text-primary group-hover:bg-primary/12"
                }`}
              >
                <Icon size={18} aria-hidden="true" />
              </span>
            ) : null}
            <span className="text-xs leading-tight font-medium">{definition.label}</span>
          </button>
        );
      })}
    </div>
  );
}
