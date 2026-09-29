import QRCode from "qrcode";
import type { QRVersionOption, QRErrorCorrectionLevel } from "@/types/qr-design";

export class QrCapacityError extends Error {
  readonly version: QRVersionOption;

  constructor(version: QRVersionOption, message: string) {
    super(message);
    this.name = "QrCapacityError";
    this.version = version;
    Object.setPrototypeOf(this, QrCapacityError.prototype);
  }
}

export interface QrMatrix {
  size: number;
  version: number;
  isDark(row: number, col: number): boolean;
  /** True for any module inside one of the 3 finder-pattern (eye) regions. */
  isFinderRegion(row: number, col: number): boolean;
  /** True for any functional/reserved QR module (finder, timing, alignment, format, version, dark module). */
  isReserved(row: number, col: number): boolean;
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
 * rather than an approximation. Supports forcing QR Version 10, 25, or 40,
 * or Auto selection.
 */
export function getQrMatrix(
  payload: string,
  errorCorrectionLevel: QRErrorCorrectionLevel = "M",
  version: QRVersionOption = "auto",
): QrMatrix {
  const forcedVersion = version && version !== "auto" ? Number(version) : undefined;

  try {
    const qr = QRCode.create(payload, {
      errorCorrectionLevel,
      version: forcedVersion,
    });
    const { modules, version: calculatedVersion } = qr;
    const { size } = modules;

    return {
      size,
      version: calculatedVersion,
      isDark: (row, col) => modules.get(row, col) === 1,
      isFinderRegion: (row, col) => isFinderRegion(row, col, size),
      isReserved: (row, col) => modules.isReserved(row, col) === 1,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("cannot contain this amount of data") ||
      msg.includes("too big to be stored in a QR Code")
    ) {
      if (version === 10) {
        throw new QrCapacityError(
          10,
          "This content is too large for QR Version 10 with the selected error-correction level. Reduce the content, lower the error-correction level, select Version 25 or Version 40, or use Auto version.",
        );
      } else if (version === 25) {
        throw new QrCapacityError(
          25,
          "This content is too large for QR Version 25 with the selected error-correction level. Reduce the content, lower the error-correction level, select Version 40, or use Auto version.",
        );
      } else if (version === 40) {
        throw new QrCapacityError(
          40,
          "This content is too large for QR Version 40 with the selected error-correction level. Reduce the content or lower the error-correction level.",
        );
      } else {
        throw new QrCapacityError(
          "auto",
          "This content is too large to fit in a QR Code with the selected error-correction level. Reduce the content or lower the error-correction level.",
        );
      }
    }
    throw err;
  }
}
