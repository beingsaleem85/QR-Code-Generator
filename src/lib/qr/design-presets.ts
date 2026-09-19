import type { DesignConfig } from "@/types/qr-design";

export interface DesignPreset {
  id: string;
  name: string;
  description: string;
  design: Omit<DesignConfig, "logo">;
}

export const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional square modules with sharp corners",
    design: {
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
    },
  },
  {
    id: "modern-minimal",
    name: "Modern",
    description: "Rounded corners with smooth square modules",
    design: {
      frame: { style: null, ctaText: null, ctaFont: null, color: "#000000" },
      pattern: { dotStyle: "rounded" },
      eyes: {
        cornerSquareStyle: "rounded",
        cornerSquareColor: "#000000",
        cornerDotStyle: "rounded",
        cornerDotColor: "#000000",
      },
      colors: {
        foreground: "#000000",
        background: "#ffffff",
        transparentBackground: false,
        gradient: null,
      },
    },
  },
  {
    id: "fine-dots",
    name: "Fine Dots",
    description: "High-density fine-dot pattern in solid black",
    design: {
      frame: { style: null, ctaText: null, ctaFont: null, color: "#000000" },
      pattern: { dotStyle: "fine-dots" },
      eyes: {
        cornerSquareStyle: "rounded",
        cornerSquareColor: "#000000",
        cornerDotStyle: "dot",
        cornerDotColor: "#000000",
      },
      colors: {
        foreground: "#000000",
        background: "#ffffff",
        transparentBackground: false,
        gradient: null,
      },
    },
  },
  {
    id: "micro-dots",
    name: "Micro Dots",
    description: "Ultra-fine dense micro-dots with crisp definition",
    design: {
      frame: { style: null, ctaText: null, ctaFont: null, color: "#000000" },
      pattern: { dotStyle: "micro-dots" },
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
    },
  },
  {
    id: "soft-round",
    name: "Soft Rounded",
    description: "Circular dots with circular eye centers",
    design: {
      frame: { style: null, ctaText: null, ctaFont: null, color: "#000000" },
      pattern: { dotStyle: "dots" },
      eyes: {
        cornerSquareStyle: "rounded",
        cornerSquareColor: "#000000",
        cornerDotStyle: "dot",
        cornerDotColor: "#000000",
      },
      colors: {
        foreground: "#000000",
        background: "#ffffff",
        transparentBackground: false,
        gradient: null,
      },
    },
  },
  {
    id: "brand-frame",
    name: "Scan Frame",
    description: "Framed QR with Scan Me call-to-action",
    design: {
      frame: { style: "simple", ctaText: "SCAN ME", ctaFont: "sans-serif", color: "#000000" },
      pattern: { dotStyle: "rounded" },
      eyes: {
        cornerSquareStyle: "rounded",
        cornerSquareColor: "#000000",
        cornerDotStyle: "dot",
        cornerDotColor: "#000000",
      },
      colors: {
        foreground: "#000000",
        background: "#ffffff",
        transparentBackground: false,
        gradient: null,
      },
    },
  },
  {
    id: "scan-badge",
    name: "Scan Badge",
    description: "Floating pill badge call-to-action",
    design: {
      frame: { style: "badge", ctaText: "SCAN ME", ctaFont: "sans-serif", color: "#000000" },
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
    },
  },
  {
    id: "boxed-frame",
    name: "Boxed Frame",
    description: "Bordered container box with bottom CTA banner",
    design: {
      frame: { style: "boxed", ctaText: "SCAN ME", ctaFont: "sans-serif", color: "#000000" },
      pattern: { dotStyle: "rounded" },
      eyes: {
        cornerSquareStyle: "rounded",
        cornerSquareColor: "#000000",
        cornerDotStyle: "rounded",
        cornerDotColor: "#000000",
      },
      colors: {
        foreground: "#000000",
        background: "#ffffff",
        transparentBackground: false,
        gradient: null,
      },
    },
  },
  {
    id: "split-card",
    name: "Split Card",
    description: "Split header card with contrasting CTA bar",
    design: {
      frame: { style: "split", ctaText: "SCAN ME", ctaFont: "sans-serif", color: "#000000" },
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
    },
  },
  {
    id: "poster-style",
    name: "Poster Style",
    description: "Bold dark poster card with prominent CTA footer",
    design: {
      frame: { style: "poster", ctaText: "SCAN ME", ctaFont: "sans-serif", color: "#000000" },
      pattern: { dotStyle: "rounded" },
      eyes: {
        cornerSquareStyle: "rounded",
        cornerSquareColor: "#000000",
        cornerDotStyle: "dot",
        cornerDotColor: "#000000",
      },
      colors: {
        foreground: "#000000",
        background: "#ffffff",
        transparentBackground: false,
        gradient: null,
      },
    },
  },
];
