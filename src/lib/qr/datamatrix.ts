import bwipjs from "bwip-js";
import type { DesignConfig } from "@/types/qr-design";

interface BwipJsWithSvg {
  toSVG: (opts: {
    bcid: string;
    text: string;
    scale?: number;
    includetext?: boolean;
    barcolor?: string;
    backgroundcolor?: string;
    paddingwidth?: number;
    paddingheight?: number;
  }) => string;
}

const bwip = bwipjs as unknown as BwipJsWithSvg;

/**
 * Generates an ISO/IEC 16022 standard Data Matrix ECC 200 SVG.
 * Supports standard ASCII/UTF-8 data as well as GS1 formatting.
 */
export function renderDataMatrixSvg(payload: string, design?: DesignConfig): string {
  if (!payload || payload.trim().length === 0) {
    throw new Error("Payload cannot be empty for Data Matrix generation");
  }

  const fgHex = (design?.colors?.foreground ?? "#000000").replace(/^#/, "");
  const bgHex = (design?.colors?.background ?? "#ffffff").replace(/^#/, "");
  const isTransparent = design?.colors?.transparentBackground ?? false;

  const svgRaw = bwip.toSVG({
    bcid: "datamatrix",
    text: payload,
    scale: 4,
    includetext: false,
    barcolor: fgHex,
    backgroundcolor: isTransparent ? undefined : bgHex,
    paddingwidth: 10,
    paddingheight: 10,
  });

  // Extract viewBox if present, and add width and height attributes if missing for canvas drawing
  const viewBoxMatch = svgRaw.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 100 100";
  const parts = viewBox.split(/\s+/).map(Number);
  const vbWidth = parts[2] || 100;
  const vbHeight = parts[3] || 100;

  let styledSvg = svgRaw;
  if (!styledSvg.includes('width="')) {
    styledSvg = styledSvg.replace("<svg ", `<svg width="${vbWidth}" height="${vbHeight}" `);
  }

  return styledSvg;
}
