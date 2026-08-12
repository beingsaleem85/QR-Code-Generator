/**
 * App-layer shape of `qr_codes.design_config` (stored as JSONB). Real
 * rendering/validation lands in Module 3.3 — this module only fixes the
 * shape so component props have something concrete to reference.
 */
export interface DesignConfig {
  frame: {
    style: string | null;
    ctaText: string | null;
    ctaFont: string | null;
    color: string;
  };
  pattern: {
    dotStyle: string;
  };
  eyes: {
    cornerSquareStyle: string;
    cornerSquareColor: string;
    cornerDotStyle: string;
    cornerDotColor: string;
  };
  colors: {
    foreground: string;
    background: string;
    transparentBackground: boolean;
    gradient: { mode: "linear" | "radial"; colors: [string, string] } | null;
  };
  logo: {
    assetUrl: string | null;
    sizeRatio: number;
    whiteMargin: boolean;
  };
}

export const DEFAULT_DESIGN_CONFIG: DesignConfig = {
  frame: { style: null, ctaText: null, ctaFont: null, color: "#000000" },
  pattern: { dotStyle: "square" },
  eyes: {
    cornerSquareStyle: "square",
    cornerSquareColor: "#000000",
    cornerDotStyle: "square",
    cornerDotColor: "#000000",
  },
  colors: {
    foreground: "#000000",
    background: "#ffffff",
    transparentBackground: false,
    gradient: null,
  },
  logo: { assetUrl: null, sizeRatio: 0.2, whiteMargin: true },
};
