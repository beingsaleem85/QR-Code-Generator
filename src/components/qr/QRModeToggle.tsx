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
      className="inline-flex gap-0.5 rounded-full border border-border bg-background p-1"
    >
      {(["static", "dynamic"] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={mode === option}
          onClick={() => onModeChange(option)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-all duration-150 ${
            mode === option
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
