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
      className="inline-flex rounded-md border border-gray-300"
    >
      {(["static", "dynamic"] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={mode === option}
          onClick={() => onModeChange(option)}
          className={`px-3 py-1.5 text-sm capitalize ${
            mode === option ? "bg-gray-900 text-white" : "text-gray-700"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
