import type { ScanDeviceType } from "@/types/analytics";

/**
 * Deliberately hand-rolled rather than a UA-parsing dependency (Module
 * 3.7): the master build prompt asks for "device class, OS, browser" as
 * privacy-safe server signals, not exhaustive UA-parsing precision, and
 * this project avoids adding a library where a small, fully-testable
 * function does the job (same reasoning as the hand-rolled charts in
 * Module 2.8). Order matters throughout — several browsers/OSes include
 * substrings of others in their real User-Agent strings (Edge and Opera
 * both contain "Chrome" and "Safari"; iOS contains "like Mac OS X"), so
 * more specific checks must run first.
 */
export interface ParsedUserAgent {
  deviceType: ScanDeviceType;
  os: string | null;
  browser: string | null;
}

const UNKNOWN: ParsedUserAgent = { deviceType: "unknown", os: null, browser: null };

function detectDeviceType(ua: string): ScanDeviceType {
  if (/ipad/i.test(ua)) return "tablet";
  if (/android/i.test(ua)) return /mobile/i.test(ua) ? "mobile" : "tablet";
  if (/iphone|ipod/i.test(ua)) return "mobile";
  if (/mobile/i.test(ua)) return "mobile";
  if (/windows|macintosh|linux|cros/i.test(ua)) return "desktop";
  return "unknown";
}

function detectOs(ua: string): string | null {
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/cros/i.test(ua)) return "Chrome OS";
  if (/linux/i.test(ua)) return "Linux";
  return null;
}

function detectBrowser(ua: string): string | null {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/chrome\/|crios\//i.test(ua)) return "Chrome";
  if (/firefox\/|fxios\//i.test(ua)) return "Firefox";
  if (/safari\//i.test(ua)) return "Safari";
  return null;
}

export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  if (!userAgent) return UNKNOWN;
  return {
    deviceType: detectDeviceType(userAgent),
    os: detectOs(userAgent),
    browser: detectBrowser(userAgent),
  };
}
