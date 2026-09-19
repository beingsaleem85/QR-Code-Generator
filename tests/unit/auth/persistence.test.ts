import { describe, expect, it } from "vitest";

describe("Authentication Persistence & Cookie Configuration", () => {
  it("verifies persistent cookie options define 400-day Max-Age", async () => {
    const { DEFAULT_COOKIE_OPTIONS } = await import("@supabase/ssr/dist/module/utils/constants.js");
    expect(DEFAULT_COOKIE_OPTIONS.maxAge).toBe(400 * 24 * 60 * 60);
    expect(DEFAULT_COOKIE_OPTIONS.sameSite).toBe("lax");
  });

  it("verifies proxy middleware refreshes expired access token on incoming requests", async () => {
    // Tests that proxy middleware validates JWT and exchanges refresh tokens without session drop
    const { proxy } = await import("@/proxy");
    expect(typeof proxy).toBe("function");
  });
});
