import QRCode from "qrcode";

export interface QrMatrix {
  size: number;
  isDark(row: number, col: number): boolean;
  /** True for any module inside one of the 3 finder-pattern (eye) regions. */
  isFinderRegion(row: number, col: number): boolean;
}

const FINDER_SPAN = 7;

/**
 * Finder patterns sit at fixed, well-known positions for any QR size
 * (per the QR spec) — top-left, top-right, bottom-left, each a 7x7 region.
 * This holds regardless of error-correction level or payload length.
 */
function isFinderRegion(row: number, col: number, size: number): boolean {
  const inTopRows = row < FINDER_SPAN;
  const inBottomRows = row >= size - FINDER_SPAN;
  const inLeftCols = col < FINDER_SPAN;
  const inRightCols = col >= size - FINDER_SPAN;
  return (inTopRows && inLeftCols) || (inTopRows && inRightCols) || (inBottomRows && inLeftCols);
}

/**
 * Builds the raw dark/light module matrix for a payload — the shared
 * foundation both the plain (Module 3.2) and styled (Module 3.3) renderers
 * read from, so pattern/eye styling always matches the QR's real geometry
 * rather than an approximation.
 */
export function getQrMatrix(
  payload: string,
  errorCorrectionLevel: "L" | "M" | "Q" | "H" = "M",
): QrMatrix {
  const { modules } = QRCode.create(payload, { errorCorrectionLevel });
  const { size } = modules;

  return {
    size,
    isDark: (row, col) => modules.get(row, col) === 1,
    isFinderRegion: (row, col) => isFinderRegion(row, col, size),
  };
}
