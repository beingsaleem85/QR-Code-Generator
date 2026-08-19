import { describe, expect, it } from "vitest";
import { generateRandomSlug } from "@/lib/qr/slug";

describe("generateRandomSlug", () => {
  it("defaults to an 8-character slug", () => {
    expect(generateRandomSlug()).toHaveLength(8);
  });

  it("respects a custom length", () => {
    expect(generateRandomSlug(12)).toHaveLength(12);
  });

  it("only uses lowercase letters and digits (URL-safe, no ambiguous casing)", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateRandomSlug()).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("produces different slugs across calls (not a fixed/deterministic value)", () => {
    const slugs = new Set(Array.from({ length: 20 }, () => generateRandomSlug()));
    expect(slugs.size).toBeGreaterThan(1);
  });
});
