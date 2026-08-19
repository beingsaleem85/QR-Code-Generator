const FALLBACK_FILE_NAME = "document.pdf";

/**
 * Never trust `payload_data.fileName` as a literal download name — it's
 * user-supplied at upload time. Strips path separators, reserved filename
 * characters, and control characters, then guarantees a `.pdf` extension,
 * so a save/share action never produces a broken or unexpected filename
 * regardless of what was typed in. Preserves spaces/hyphens — those are
 * ordinary, safe filename characters, not something to strip.
 */
export function sanitizePdfFileName(name: string | null | undefined): string {
  if (!name) return FALLBACK_FILE_NAME;

  const cleaned = name.replace(/[\\/:*?"<>|\x00-\x1f]/g, "").trim();
  if (!cleaned) return FALLBACK_FILE_NAME;

  return /\.pdf$/i.test(cleaned) ? cleaned : `${cleaned}.pdf`;
}

export const ZOOM_MIN_PERCENT = 50;
export const ZOOM_MAX_PERCENT = 300;
export const ZOOM_STEP_PERCENT = 25;

export function clampZoomPercent(percent: number): number {
  return Math.min(ZOOM_MAX_PERCENT, Math.max(ZOOM_MIN_PERCENT, percent));
}
