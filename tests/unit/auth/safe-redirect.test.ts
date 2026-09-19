import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/auth/safe-redirect";

describe("safeNext utility", () => {
  it("defaults to fallback when null, undefined, empty, or whitespace", () => {
    expect(safeNext(null)).toBe("/dashboard");
    expect(safeNext(undefined)).toBe("/dashboard");
    expect(safeNext("")).toBe("/dashboard");
    expect(safeNext("   ")).toBe("/dashboard");
    expect(safeNext(null, "/fallback")).toBe("/fallback");
  });

  it("rejects absolute external URLs", () => {
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("http://attacker.com/steal")).toBe("/dashboard");
    expect(safeNext("ftp://bad.com/file")).toBe("/dashboard");
    expect(safeNext("javascript:alert(1)")).toBe("/dashboard");
    expect(safeNext("data:text/html,<script>alert(1)</script>")).toBe("/dashboard");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("//evil.com/path")).toBe("/dashboard");
    expect(safeNext("///evil.com")).toBe("/dashboard");
  });

  it("rejects backslash bypass attempts", () => {
    expect(safeNext("/\\evil.com")).toBe("/dashboard");
    expect(safeNext("\\evil.com")).toBe("/dashboard");
    expect(safeNext("/dashboard\\..\\evil.com")).toBe("/dashboard");
    expect(safeNext("/login\\evil.com")).toBe("/dashboard");
  });

  it("preserves safe same-origin relative paths and parameters", () => {
    expect(safeNext("/dashboard")).toBe("/dashboard");
    expect(safeNext("/dashboard/qr-codes/new")).toBe("/dashboard/qr-codes/new");
    expect(safeNext("/qr-generator")).toBe("/qr-generator");
    expect(safeNext("/dashboard/qr-codes?page=2&pageSize=25")).toBe(
      "/dashboard/qr-codes?page=2&pageSize=25",
    );
    expect(safeNext("/dashboard/account#plan")).toBe("/dashboard/account#plan");
  });
});
