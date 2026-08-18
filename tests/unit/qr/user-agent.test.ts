import { describe, expect, it } from "vitest";
import { parseUserAgent } from "@/lib/qr/user-agent";

const UA = {
  chromeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  safariMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  safariIpad:
    "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  chromeAndroidPhone:
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  chromeAndroidTablet:
    "Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  firefoxLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
  edgeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  operaWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0",
  chromeOs:
    "Mozilla/5.0 (X11; CrOS x86_64 15633.69.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

describe("parseUserAgent", () => {
  it("returns unknown/null for a missing User-Agent", () => {
    expect(parseUserAgent(null)).toEqual({ deviceType: "unknown", os: null, browser: null });
    expect(parseUserAgent(undefined)).toEqual({ deviceType: "unknown", os: null, browser: null });
    expect(parseUserAgent("")).toEqual({ deviceType: "unknown", os: null, browser: null });
  });

  it("classifies desktop Chrome on Windows", () => {
    expect(parseUserAgent(UA.chromeWindows)).toEqual({
      deviceType: "desktop",
      os: "Windows",
      browser: "Chrome",
    });
  });

  it("classifies desktop Safari on macOS", () => {
    expect(parseUserAgent(UA.safariMac)).toEqual({
      deviceType: "desktop",
      os: "macOS",
      browser: "Safari",
    });
  });

  it("classifies mobile Safari on iPhone as iOS, not macOS", () => {
    expect(parseUserAgent(UA.safariIphone)).toEqual({
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    });
  });

  it("classifies iPad as tablet/iOS, distinct from iPhone", () => {
    expect(parseUserAgent(UA.safariIpad)).toEqual({
      deviceType: "tablet",
      os: "iOS",
      browser: "Safari",
    });
  });

  it("classifies an Android phone as mobile via the Mobile token", () => {
    expect(parseUserAgent(UA.chromeAndroidPhone)).toEqual({
      deviceType: "mobile",
      os: "Android",
      browser: "Chrome",
    });
  });

  it("classifies an Android tablet as tablet (no Mobile token)", () => {
    expect(parseUserAgent(UA.chromeAndroidTablet)).toEqual({
      deviceType: "tablet",
      os: "Android",
      browser: "Chrome",
    });
  });

  it("classifies desktop Firefox on Linux", () => {
    expect(parseUserAgent(UA.firefoxLinux)).toEqual({
      deviceType: "desktop",
      os: "Linux",
      browser: "Firefox",
    });
  });

  it("classifies Edge as Edge, not Chrome, despite containing 'Chrome' in its UA", () => {
    expect(parseUserAgent(UA.edgeWindows).browser).toBe("Edge");
  });

  it("classifies Opera as Opera, not Chrome, despite containing 'Chrome' in its UA", () => {
    expect(parseUserAgent(UA.operaWindows).browser).toBe("Opera");
  });

  it("classifies Chrome OS distinctly from Linux", () => {
    expect(parseUserAgent(UA.chromeOs).os).toBe("Chrome OS");
  });

  it("falls back to unknown/null for an unrecognized User-Agent", () => {
    expect(parseUserAgent("SomeCustomBot/1.0")).toEqual({
      deviceType: "unknown",
      os: null,
      browser: null,
    });
  });
});
