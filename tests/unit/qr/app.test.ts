import { describe, expect, it } from "vitest";
import { appQrSchema } from "@/lib/validation/qr";
import { buildAppPayload } from "@/lib/qr/payload-builders";

describe("appQrSchema", () => {
  it("accepts a title with just a fallback URL", () => {
    const result = appQrSchema.safeParse({ title: "Get our app", fallbackUrl: "example.com" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fallbackUrl).toBe("https://example.com");
  });

  it("accepts all three link fields", () => {
    const result = appQrSchema.safeParse({
      title: "Get our app",
      iosUrl: "https://apps.apple.com/app/id123",
      androidUrl: "https://play.google.com/store/apps/details?id=com.example",
      fallbackUrl: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a title with no links at all", () => {
    expect(appQrSchema.safeParse({ title: "Get our app" }).success).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(appQrSchema.safeParse({ title: "", fallbackUrl: "https://example.com" }).success).toBe(
      false,
    );
  });

  it("rejects a malformed URL", () => {
    expect(appQrSchema.safeParse({ title: "Get our app", fallbackUrl: "not a url" }).success).toBe(
      false,
    );
  });
});

describe("buildAppPayload", () => {
  it("returns the title — never actually encoded into a QR image", () => {
    expect(
      buildAppPayload({
        title: "Get our app",
        iosUrl: undefined,
        androidUrl: undefined,
        fallbackUrl: "https://example.com",
      }),
    ).toBe("Get our app");
  });
});
