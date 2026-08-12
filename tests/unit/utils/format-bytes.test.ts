import { describe, expect, it } from "vitest";
import { formatBytes } from "@/lib/utils/format-bytes";

describe("formatBytes", () => {
  it("formats zero bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes below 1KB with no decimal", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes with one decimal", () => {
    expect(formatBytes(128_000)).toBe("125.0 KB");
  });

  it("formats megabytes with one decimal", () => {
    expect(formatBytes(2_100_000)).toBe("2.0 MB");
  });
});
