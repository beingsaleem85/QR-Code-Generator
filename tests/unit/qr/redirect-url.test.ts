import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildRedirectUrl, isSafeRedirectTarget } from "@/lib/qr/redirect-url";

describe("buildRedirectUrl", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it("builds an /r/[slug] URL from the configured app URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.app";
    expect(buildRedirectUrl("abc12345")).toBe("https://example.app/r/abc12345");
  });

  it("strips a trailing slash from the configured app URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.app/";
    expect(buildRedirectUrl("abc12345")).toBe("https://example.app/r/abc12345");
  });

  it("falls back to localhost when the app URL isn't configured", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(buildRedirectUrl("abc12345")).toBe("http://localhost:3000/r/abc12345");
  });
});

describe("isSafeRedirectTarget", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.app";
  });

  it("accepts http and https URLs", () => {
    expect(isSafeRedirectTarget("https://example.com")).toBe(true);
    expect(isSafeRedirectTarget("http://example.com")).toBe(true);
  });

  it("rejects dangerous non-http(s) schemes", () => {
    expect(isSafeRedirectTarget("javascript:alert(1)")).toBe(false);
    expect(isSafeRedirectTarget("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeRedirectTarget("file:///etc/passwd")).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isSafeRedirectTarget("not a url")).toBe(false);
    expect(isSafeRedirectTarget("")).toBe(false);
  });
});
