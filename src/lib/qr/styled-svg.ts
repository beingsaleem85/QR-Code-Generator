import { getQrMatrix, QrCapacityError } from "@/lib/qr/matrix";
import { renderQrSvg } from "@/lib/qr/render";
import { renderDataMatrixSvg } from "@/lib/qr/datamatrix";
import {
  clampLogoSizeRatio,
  getContrastWarning,
  getRecommendedErrorCorrectionLevel,
} from "@/lib/qr/reliability";
import type { DesignConfig } from "@/types/qr-design";
import type { QRType } from "@/types/qr";

const CELL = 10;
/** Exact 10px outer padding on all sides (Top: 10px, Right: 10px, Bottom: 10px, Left: 10px) */
export const QR_OUTER_PADDING = 10;

export interface StyledQrResult {
  svg: string;
  /** User-facing reliability notices — contrast, clamped logo size, fallback used. */
  warnings: string[];
  error?: string;
  version?: number;
  matrixSize?: number;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function moduleShape(x: number, y: number, style: string, fill: string): string {
  switch (style) {
    case "micro-dots": {
      const r = (CELL / 2) * 0.42;
      return `<circle cx="${x + CELL / 2}" cy="${y + CELL / 2}" r="${r}" fill="${fill}" />`;
    }
    case "fine-dots": {
      const r = (CELL / 2) * 0.58;
      return `<circle cx="${x + CELL / 2}" cy="${y + CELL / 2}" r="${r}" fill="${fill}" />`;
    }
    case "dots": {
      const r = (CELL / 2) * 0.85;
      return `<circle cx="${x + CELL / 2}" cy="${y + CELL / 2}" r="${r}" fill="${fill}" />`;
    }
    case "rounded":
      return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="${CELL * 0.3}" fill="${fill}" />`;
    default:
      return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${fill}" />`;
  }
}

function eyeOuterShape(x: number, y: number, size: number, style: string, color: string): string {
  const strokeWidth = CELL;
  const inset = strokeWidth / 2;
  const rectSize = size - strokeWidth;
  const rx =
    style === "rounded"
      ? strokeWidth
      : style === "dot" || style === "circle"
        ? rectSize / 2
        : 0;
  return `<rect x="${x + inset}" y="${y + inset}" width="${rectSize}" height="${rectSize}" rx="${rx}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />`;
}

function eyeInnerShape(x: number, y: number, size: number, style: string, color: string): string {
  if (style === "dot" || style === "circle") {
    return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" fill="${color}" />`;
  }
  if (style === "diamond") {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const half = size / 2;
    return `<polygon points="${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}" fill="${color}" />`;
  }
  const rx = style === "rounded" ? size * 0.3 : 0;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="${color}" />`;
}

/**
 * Real per-module design rendering (Module 3.3) — pattern/eye shapes,
 * gradients, logo overlay, and frames, built directly off the QR's raw
 * module matrix (`getQrMatrix`) rather than any library's fixed SVG
 * output. Falls back to the plain Module 3.2 renderer (solid colors only)
 * if styling fails, but preserves strict capacity errors when fixed QR
 * versions are requested.
 */
export async function renderStyledQrSvg(
  payload: string,
  design: DesignConfig,
  qrType?: QRType,
): Promise<StyledQrResult> {
  if (qrType === "barcode_2d") {
    try {
      const svg = renderDataMatrixSvg(payload, design);
      const warnings: string[] = [];
      const contrastWarning = getContrastWarning(
        design.colors.foreground,
        design.colors.transparentBackground ? "#ffffff" : design.colors.background,
      );
      if (contrastWarning) warnings.push(contrastWarning);
      return { svg, warnings };
    } catch {
      // Fall through to regular renderer if datamatrix fails
    }
  }

  try {
    return renderStyledQrSvgUnsafe(payload, design);
  } catch (err: unknown) {
    if (err instanceof QrCapacityError) {
      return {
        svg: "",
        warnings: [],
        error: err.message,
      };
    }
    const svg = await renderQrSvg(payload, design);
    return {
      svg,
      warnings: ["Some design options couldn't be applied — showing a simplified version."],
    };
  }
}

function renderStyledQrSvgUnsafe(payload: string, design: DesignConfig): StyledQrResult {
  const { colors, pattern, eyes, logo, frame } = design;
  const warnings: string[] = [];

  const hasLogo = !!logo.assetUrl;
  const ecLevel = design.errorCorrectionLevel ?? getRecommendedErrorCorrectionLevel(hasLogo);
  const matrix = getQrMatrix(payload, ecLevel, design.version ?? "auto");

  const contrastWarning = getContrastWarning(
    colors.foreground,
    colors.transparentBackground ? "#ffffff" : colors.background,
  );
  if (contrastWarning) warnings.push(contrastWarning);

  const qrSize = matrix.size * CELL;

  // Maintain at least the QR-standard minimum 4-module quiet zone around the actual QR symbol
  // for Version 10, Version 25, Version 40 (4 * CELL = 40px).
  // For Auto mode without a forced version, preserve the existing 10px visual outer padding.
  const isForcedLargeVersion =
    design.version === 10 || design.version === 25 || design.version === 40;
  const quiet = isForcedLargeVersion ? 4 * CELL : QR_OUTER_PADDING;
  const core = qrSize + 2 * quiet;

  const hasBorderFrame =
    frame.style === "simple" ||
    frame.style === "rounded" ||
    frame.style === "boxed" ||
    frame.style === "poster";
  const isSplit = frame.style === "split";
  const border = hasBorderFrame || isSplit ? 2 * CELL : 0;
  const topHeaderHeight = isSplit ? 2.5 * CELL : 0;
  const ctaHeight = frame.style && frame.ctaText ? 3.5 * CELL : 0;

  const width = core + 2 * border;
  const height = core + 2 * border + topHeaderHeight + ctaHeight;
  const qrOffset = border + quiet;
  const qrYOffset = border + quiet + topHeaderHeight;

  let defs = "";
  let fill = colors.foreground;
  if (colors.gradient) {
    const [c1, c2] = colors.gradient.colors;
    const tag = colors.gradient.mode === "radial" ? "radialGradient" : "linearGradient";
    const coords = colors.gradient.mode === "radial" ? "" : ' x1="0%" y1="0%" x2="100%" y2="100%"';
    defs += `<${tag} id="qr-fg-gradient"${coords}><stop offset="0%" stop-color="${c1}" /><stop offset="100%" stop-color="${c2}" /></${tag}>`;
    fill = "url(#qr-fg-gradient)";
  }

  const bodyParts: string[] = [];

  if (frame.style === "rounded") {
    const rx = border * 1.2;
    bodyParts.push(`<rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" fill="${frame.color}" />`);
  } else if (frame.style === "simple") {
    bodyParts.push(`<rect x="0" y="0" width="${width}" height="${height}" rx="0" fill="${frame.color}" />`);
  } else if (frame.style === "boxed") {
    const strokeWidth = border * 0.75;
    bodyParts.push(`<rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" width="${width - strokeWidth}" height="${height - strokeWidth}" rx="6" fill="none" stroke="${frame.color}" stroke-width="${strokeWidth}" />`);
    bodyParts.push(`<rect x="0" y="${height - ctaHeight}" width="${width}" height="${ctaHeight}" rx="0" fill="${frame.color}" />`);
  } else if (frame.style === "poster") {
    bodyParts.push(`<rect x="0" y="0" width="${width}" height="${height}" rx="${border * 1.5}" fill="${frame.color}" opacity="0.12" />`);
    bodyParts.push(`<rect x="0" y="0" width="${width}" height="${height}" rx="${border * 1.5}" fill="none" stroke="${frame.color}" stroke-width="2.5" />`);
    const pillMargin = border * 0.5;
    bodyParts.push(`<rect x="${pillMargin}" y="${height - ctaHeight - 2}" width="${width - 2 * pillMargin}" height="${ctaHeight}" rx="${ctaHeight / 2}" fill="${frame.color}" />`);
  } else if (frame.style === "split") {
    bodyParts.push(`<rect x="0" y="0" width="${width}" height="${topHeaderHeight}" rx="0" fill="${frame.color}" />`);
    bodyParts.push(`<rect x="0" y="${height - ctaHeight}" width="${width}" height="${ctaHeight}" rx="0" fill="${frame.color}" />`);
  }

  if (!colors.transparentBackground) {
    bodyParts.push(`<rect x="${border}" y="${border + topHeaderHeight}" width="${core}" height="${core}" fill="${colors.background}" />`);
  }

  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (!matrix.isDark(row, col) || matrix.isFinderRegion(row, col)) continue;
      const x = qrOffset + col * CELL;
      const y = qrYOffset + row * CELL;

      // Functional module protection: timing patterns, alignment patterns, format information,
      // version information, and dark module must remain solid standard squares so custom
      // dot styles (dots, micro-dots, rounded) do not damage scanning reliability.
      const isFunctional = matrix.isReserved(row, col);
      const dotStyle = isFunctional ? "square" : pattern.dotStyle;
      bodyParts.push(moduleShape(x, y, dotStyle, fill));
    }
  }

  const finderCorners: Array<[number, number]> = [
    [0, 0],
    [0, matrix.size - 7],
    [matrix.size - 7, 0],
  ];
  for (const [rowStart, colStart] of finderCorners) {
    const x = qrOffset + colStart * CELL;
    const y = qrYOffset + rowStart * CELL;
    const outerSize = 7 * CELL;
    const innerSize = 3 * CELL;
    const innerOffset = 2 * CELL;
    bodyParts.push(eyeOuterShape(x, y, outerSize, eyes.cornerSquareStyle, eyes.cornerSquareColor));
    bodyParts.push(
      eyeInnerShape(
        x + innerOffset,
        y + innerOffset,
        innerSize,
        eyes.cornerDotStyle,
        eyes.cornerDotColor,
      ),
    );
  }

  if (logo.assetUrl) {
    const clampedRatio = clampLogoSizeRatio(logo.sizeRatio);
    if (clampedRatio !== logo.sizeRatio) {
      warnings.push("Logo size was adjusted to a safe range to keep the QR code scannable.");
    }
    const logoSize = qrSize * clampedRatio;
    const logoX = qrOffset + (qrSize - logoSize) / 2;
    const logoY = qrYOffset + (qrSize - logoSize) / 2;

    if (logo.whiteMargin) {
      const pad = logoSize * 0.075;
      const bg = colors.transparentBackground ? "#ffffff" : colors.background;
      bodyParts.push(`<rect x="${logoX - pad}" y="${logoY - pad}" width="${logoSize + 2 * pad}" height="${logoSize + 2 * pad}" rx="${(logoSize + 2 * pad) * 0.15}" fill="${bg}" />`);
    }
    bodyParts.push(`<image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${logo.assetUrl}" xlink:href="${logo.assetUrl}" preserveAspectRatio="xMidYMid slice" />`);
  }

  if (frame.style && frame.ctaText) {
    const barY = height - ctaHeight;
    if (frame.style === "badge") {
      const badgeWidth = Math.min(width * 0.85, 160);
      const badgeX = (width - badgeWidth) / 2;
      bodyParts.push(`<rect x="${badgeX}" y="${barY}" width="${badgeWidth}" height="${ctaHeight}" rx="${ctaHeight / 2}" fill="${frame.color}" />`);
    }
    const textY = frame.style === "poster" ? barY + ctaHeight / 2 - 2 : barY + ctaHeight / 2;
    const fontFamily = frame.ctaFont || "sans-serif";
    bodyParts.push(`<text x="${width / 2}" y="${textY}" text-anchor="middle" dominant-baseline="middle" font-family="${escapeXml(fontFamily)}" font-size="${CELL * 1.8}" font-weight="bold" fill="#ffffff">${escapeXml(frame.ctaText)}</text>`);
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    (defs ? `<defs>${defs}</defs>` : "") +
    bodyParts.join("") +
    `</svg>`;

  return {
    svg,
    warnings,
    version: matrix.version,
    matrixSize: matrix.size,
  };
}

export interface StyledQrPngResult {
  dataUrl: string;
  warnings: string[];
  error?: string;
}

/**
 * Derives a PNG from the same styled SVG rather than re-implementing every
 * shape/gradient/logo/frame a second time in canvas draw calls — one
 * rendering pipeline, not two. Browser-only (`Image`/`canvas`), so this
 * must be called from a Client Component. The intermediate object URL is
 * revoked immediately after the image loads.
 */
export async function renderStyledQrPngDataUrl(
  payload: string,
  design: DesignConfig,
  targetWidth = 512,
  qrType?: QRType,
): Promise<StyledQrPngResult> {
  const { svg, warnings, error } = await renderStyledQrSvg(payload, design, qrType);

  if (error || !svg) {
    return { dataUrl: "", warnings, error };
  }

  const svgWidth = Number(svg.match(/\swidth="([\d.]+)"/)?.[1] ?? targetWidth);
  const svgHeight = Number(svg.match(/\sheight="([\d.]+)"/)?.[1] ?? targetWidth);
  const targetHeight = Math.round(targetWidth * (svgHeight / svgWidth));

  const blobUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = await loadImage(blobUrl);
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
    return { dataUrl: canvas.toDataURL("image/png"), warnings };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load QR image for PNG export"));
    image.src = src;
  });
}
