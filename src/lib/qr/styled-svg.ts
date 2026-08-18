import { getQrMatrix } from "@/lib/qr/matrix";
import { renderQrSvg } from "@/lib/qr/render";
import {
  clampLogoSizeRatio,
  getContrastWarning,
  getRecommendedErrorCorrectionLevel,
  MIN_QUIET_ZONE_MODULES,
} from "@/lib/qr/reliability";
import type { DesignConfig } from "@/types/qr-design";

const CELL = 10;

export interface StyledQrResult {
  svg: string;
  /** User-facing reliability notices — contrast, clamped logo size, fallback used. */
  warnings: string[];
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
  const rx = style === "rounded" ? strokeWidth : style === "dot" ? rectSize / 2 : 0;
  return `<rect x="${x + inset}" y="${y + inset}" width="${rectSize}" height="${rectSize}" rx="${rx}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />`;
}

function eyeInnerShape(x: number, y: number, size: number, style: string, color: string): string {
  if (style === "dot") {
    return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" fill="${color}" />`;
  }
  const rx = style === "rounded" ? size * 0.3 : 0;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="${color}" />`;
}

/**
 * Real per-module design rendering (Module 3.3) — pattern/eye shapes,
 * gradients, logo overlay, and frames, built directly off the QR's raw
 * module matrix (`getQrMatrix`) rather than any library's fixed SVG
 * output. Falls back to the plain Module 3.2 renderer (solid colors only)
 * if anything here throws — the "fallback if a styling option is
 * unsupported" reliability rule, implemented as real behavior rather than
 * just documented.
 */
export async function renderStyledQrSvg(
  payload: string,
  design: DesignConfig,
): Promise<StyledQrResult> {
  try {
    return renderStyledQrSvgUnsafe(payload, design);
  } catch {
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
  const matrix = getQrMatrix(payload, getRecommendedErrorCorrectionLevel(hasLogo));

  const contrastWarning = getContrastWarning(
    colors.foreground,
    colors.transparentBackground ? "#ffffff" : colors.background,
  );
  if (contrastWarning) warnings.push(contrastWarning);

  const qrSize = matrix.size * CELL;
  const quiet = MIN_QUIET_ZONE_MODULES * CELL;
  const core = qrSize + 2 * quiet;

  const hasBorderFrame = frame.style === "simple" || frame.style === "rounded";
  const border = hasBorderFrame ? 2 * CELL : 0;
  const ctaHeight = frame.style && frame.ctaText ? 3.5 * CELL : 0;

  const width = core + 2 * border;
  const height = core + 2 * border + ctaHeight;
  const qrOffset = border + quiet;

  let defs = "";
  let fill = colors.foreground;
  if (colors.gradient) {
    const [c1, c2] = colors.gradient.colors;
    const tag = colors.gradient.mode === "radial" ? "radialGradient" : "linearGradient";
    const coords = colors.gradient.mode === "radial" ? "" : ' x1="0%" y1="0%" x2="100%" y2="100%"';
    defs += `<${tag} id="qr-fg-gradient"${coords}><stop offset="0%" stop-color="${c1}" /><stop offset="100%" stop-color="${c2}" /></${tag}>`;
    fill = "url(#qr-fg-gradient)";
  }

  let body = "";

  if (hasBorderFrame) {
    const rx = frame.style === "rounded" ? border : 0;
    body += `<rect x="0" y="0" width="${width}" height="${core + 2 * border}" rx="${rx}" fill="${frame.color}" />`;
  }

  if (!colors.transparentBackground) {
    body += `<rect x="${border}" y="${border}" width="${core}" height="${core}" fill="${colors.background}" />`;
  }

  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (!matrix.isDark(row, col) || matrix.isFinderRegion(row, col)) continue;
      const x = qrOffset + col * CELL;
      const y = qrOffset + row * CELL;
      body += moduleShape(x, y, pattern.dotStyle, fill);
    }
  }

  const finderCorners: Array<[number, number]> = [
    [0, 0],
    [0, matrix.size - 7],
    [matrix.size - 7, 0],
  ];
  for (const [rowStart, colStart] of finderCorners) {
    const x = qrOffset + colStart * CELL;
    const y = qrOffset + rowStart * CELL;
    const outerSize = 7 * CELL;
    const innerSize = 3 * CELL;
    const innerOffset = 2 * CELL;
    body += eyeOuterShape(x, y, outerSize, eyes.cornerSquareStyle, eyes.cornerSquareColor);
    body += eyeInnerShape(
      x + innerOffset,
      y + innerOffset,
      innerSize,
      eyes.cornerDotStyle,
      eyes.cornerDotColor,
    );
  }

  if (logo.assetUrl) {
    const clampedRatio = clampLogoSizeRatio(logo.sizeRatio);
    if (clampedRatio !== logo.sizeRatio) {
      warnings.push("Logo size was adjusted to a safe range to keep the QR code scannable.");
    }
    const logoSize = qrSize * clampedRatio;
    const logoX = qrOffset + (qrSize - logoSize) / 2;
    const logoY = qrOffset + (qrSize - logoSize) / 2;

    if (logo.whiteMargin) {
      const pad = logoSize * 0.15;
      const bg = colors.transparentBackground ? "#ffffff" : colors.background;
      body += `<rect x="${logoX - pad}" y="${logoY - pad}" width="${logoSize + 2 * pad}" height="${logoSize + 2 * pad}" rx="${(logoSize + 2 * pad) * 0.15}" fill="${bg}" />`;
    }
    body += `<image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${logo.assetUrl}" xlink:href="${logo.assetUrl}" preserveAspectRatio="xMidYMid slice" />`;
  }

  if (frame.style && frame.ctaText) {
    const barY = frame.style === "badge" ? core : core + 2 * border;
    if (frame.style === "badge") {
      body += `<rect x="0" y="${barY}" width="${width}" height="${ctaHeight}" fill="${frame.color}" />`;
    }
    const fontFamily = frame.ctaFont || "sans-serif";
    body += `<text x="${width / 2}" y="${barY + ctaHeight / 2}" text-anchor="middle" dominant-baseline="middle" font-family="${escapeXml(fontFamily)}" font-size="${CELL * 2}" fill="#ffffff">${escapeXml(frame.ctaText)}</text>`;
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    (defs ? `<defs>${defs}</defs>` : "") +
    body +
    `</svg>`;

  return { svg, warnings };
}

export interface StyledQrPngResult {
  dataUrl: string;
  warnings: string[];
}

/**
 * Derives a PNG from the same styled SVG rather than re-implementing every
 * shape/gradient/logo/frame a second time in canvas draw calls — one
 * rendering pipeline, not two. Browser-only (`Image`/`canvas`), so this
 * must be called from a Client Component. The intermediate object URL is
 * revoked immediately after the image loads — a genuinely short-lived,
 * single-use blob, unlike the logo asset (stored as a data URL precisely
 * so it doesn't need this kind of lifecycle tracking across long-lived
 * React state).
 */
export async function renderStyledQrPngDataUrl(
  payload: string,
  design: DesignConfig,
  targetWidth = 512,
): Promise<StyledQrPngResult> {
  const { svg, warnings } = await renderStyledQrSvg(payload, design);

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
