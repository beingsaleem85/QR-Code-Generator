"use client";

import type { QRVersionOption } from "@/types/qr-design";

interface QRVersionSelectorProps {
  value: QRVersionOption;
  onChange: (version: QRVersionOption) => void;
  disabled?: boolean;
}

const VERSION_OPTIONS: Array<{
  key: QRVersionOption;
  label: string;
  hint: string;
}> = [
  { key: "auto", label: "Auto", hint: "Automatically selects the required version." },
  { key: 10, label: "Version 10", hint: "57 × 57 modules" },
  { key: 25, label: "Version 25", hint: "117 × 117 modules" },
  { key: 40, label: "Version 40", hint: "177 × 177 modules" },
];

export function QRVersionSelector({
  value = "auto",
  onChange,
  disabled = false,
}: QRVersionSelectorProps) {
  const currentOption =
    VERSION_OPTIONS.find((opt) => opt.key === value) ?? VERSION_OPTIONS[0];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
          QR Version
        </label>
        <span className="text-[11px] font-medium text-muted-foreground">
          {currentOption.hint}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="QR Version"
        className={`inline-flex flex-wrap gap-1 rounded-xl border border-border bg-background p-1 ${
          disabled ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {VERSION_OPTIONS.map((option) => {
          const isSelected = value === option.key;

          return (
            <button
              key={String(option.key)}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(option.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                isSelected
                  ? "bg-gradient-to-b from-primary to-primary-hover text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-raised"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Choose the QR matrix version manually or use Auto to let the encoder select the appropriate version.
      </p>
    </div>
  );
}
