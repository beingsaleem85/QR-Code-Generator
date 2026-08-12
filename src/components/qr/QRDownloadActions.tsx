"use client";

import { Button } from "@/components/ui/Button";

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
      <Button variant="primary" disabled={disabled}>
        Save QR
      </Button>
      <Button variant="secondary" disabled={disabled}>
        Download
      </Button>
    </div>
  );
}
