"use client";

interface QRDownloadActionsProps {
  disabled?: boolean;
}

/**
 * Structure-phase skeleton — buttons render but do nothing yet. Save
 * persistence is Module 3.5, PNG/SVG export is Module 3.4.
 */
export function QRDownloadActions({ disabled = true }: QRDownloadActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={disabled}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Save QR
      </button>
      <button
        type="button"
        disabled={disabled}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
      >
        Download
      </button>
    </div>
  );
}
