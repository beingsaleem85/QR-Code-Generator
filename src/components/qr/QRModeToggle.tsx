"use client";

import type { QRMode } from "@/types/qr";

interface QRModeToggleProps {
  mode: QRMode;
  onModeChange: (mode: QRMode) => void;
}

export function QRModeToggle({ mode, onModeChange }: QRModeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="QR mode"
      className="inline-flex rounded-md border border-border"
    >
      {(["static", "dynamic"] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={mode === option}
          onClick={() => onModeChange(option)}
          className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
            mode === option
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
