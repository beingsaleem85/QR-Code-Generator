/**
 * Scan-reliability safeguards (Module 3.3's "Reliability Rules"). These are
 * deliberately conservative heuristics, not a scan-success guarantee — the
 * master prompt is explicit that guaranteeing reliability under every
 * possible extreme style combination is out of scope.
 */

/** Minimum quiet zone in modules, per the QR spec's own recommendation. */
export const MIN_QUIET_ZONE_MODULES = 4;

/**
 * Empirically, QR scanners tolerate lower contrast than human text
 * readability needs (WCAG's 4.5:1 is a text-legibility bar, not a QR-
 * scanning one) — but very low contrast (near-identical colors) does
 * genuinely risk scan failures. This threshold is intentionally lower
 * than WCAG AA, and only fires for cases that would plausibly fail.
 */
const MIN_QR_CONTRAST_RATIO = 2.5;

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const num = parseInt(value.slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [rl, gl, bl] = [channel(r), channel(g), channel(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** WCAG relative-luminance contrast ratio — reused as a practical proxy for "distinguishable enough to scan." */
export function getContrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getContrastWarning(foreground: string, background: string): string | null {
  const ratio = getContrastRatio(foreground, background);
  if (ratio < MIN_QR_CONTRAST_RATIO) {
    return "Foreground and background colors are too close in contrast — this QR code may not scan reliably.";
  }
  return null;
}

/**
 * Matches the existing logo-size slider's own min/max (Module 2.4's
 * `design-controls.tsx`) — kept here as the single source of truth so the
 * renderer and the UI control can never drift apart.
 */
export const LOGO_SIZE_RATIO_RANGE = { min: 0.1, max: 0.3 } as const;

export function clampLogoSizeRatio(ratio: number): number {
  return Math.min(LOGO_SIZE_RATIO_RANGE.max, Math.max(LOGO_SIZE_RATIO_RANGE.min, ratio));
}

/**
 * A logo covers part of the QR's data/error-correction modules, so a
 * higher error-correction level is needed to keep it scannable — "H"
 * (~30% recoverable) rather than the plain default "M" (~15%).
 */
export function getRecommendedErrorCorrectionLevel(hasLogo: boolean): "M" | "H" {
  return hasLogo ? "H" : "M";
}
