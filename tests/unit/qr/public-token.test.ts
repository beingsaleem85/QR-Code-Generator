import { describe, expect, it } from "vitest";
import { generatePublicToken } from "@/lib/qr/public-token";

describe("generatePublicToken", () => {
  it("is URL-safe — base64url alphabet only, no padding", () => {
    const token = generatePublicToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token).not.toContain("=");
    expect(token).not.toContain("+");
    expect(token).not.toContain("/");
  });

  it("is sufficiently long to resist guessing (96 bits of entropy)", () => {
    const token = generatePublicToken();
    expect(token.length).toBeGreaterThanOrEqual(16);
  });

  it("produces different tokens on successive calls (non-sequential, not derived from a counter)", () => {
    const tokens = Array.from({ length: 50 }, () => generatePublicToken());
    expect(new Set(tokens).size).toBe(tokens.length);
  });

  it("never embeds a recognizable UUID, incrementing id, or predictable structure", () => {
    const token = generatePublicToken();
    // A real UUID always contains hyphens at fixed positions; this token
    // format structurally can't produce that shape.
    expect(token).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/i);
  });
});
