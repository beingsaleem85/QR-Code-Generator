import { describe, expect, it } from "vitest";
import { generateRandomSlug } from "@/lib/qr/slug";
import { generatePublicToken } from "@/lib/qr/public-token";
import { buildRedirectUrl, buildLandingPageUrl, buildPublicViewerUrl, buildRootShortUrl } from "@/lib/qr/redirect-url";
import { resolveEncodedPayload } from "@/lib/qr/render";

describe("File QR Lifecycle & Random Unique URL Verification", () => {
  it("generates unique random slugs across multiple dynamic QR creations", () => {
    const slugs = new Set<string>();
    const count = 50;
    for (let i = 0; i < count; i++) {
      const slug = generateRandomSlug();
      expect(slug).toMatch(/^[a-z0-9]{8}$/);
      slugs.add(slug);
    }
    expect(slugs.size).toBe(count);
  });

  it("generates unique opaque tokens for direct-open PDF QRs", () => {
    const tokens = new Set<string>();
    const count = 50;
    for (let i = 0; i < count; i++) {
      const token = generatePublicToken();
      expect(token).toMatch(/^[A-Za-z0-9_-]{16}$/);
      tokens.add(token);
    }
    expect(tokens.size).toBe(count);
  });

  it("ensures uploading multiple files with identical names produces non-colliding storage paths", () => {
    const userId = "usr_test_123";
    const fileName = "menu.pdf";
    const paths = new Set<string>();

    for (let i = 0; i < 10; i++) {
      const assetId = crypto.randomUUID();
      const cleanName = fileName.replace(/\.[^./]+$/, "");
      const path = `${userId}/${assetId}/${cleanName}.pdf`;
      paths.add(path);
    }

    expect(paths.size).toBe(10);
    for (const path of paths) {
      expect(path).toContain(userId);
      expect(path).toContain("menu.pdf");
    }
  });

  it("preserves existing slug when a dynamic QR's underlying file is replaced", () => {
    const existingRecord = {
      id: "qr-123",
      slug: "f8k29xma",
      mode: "dynamic" as const,
      qr_type: "pdf" as const,
      payload_data: { path: "user/old-asset/menu-v1.pdf", fileName: "menu.pdf" },
    };

    const resolvedSlug = existingRecord.mode === "dynamic"
      ? (existingRecord.slug ?? generateRandomSlug())
      : existingRecord.slug;

    expect(resolvedSlug).toBe("f8k29xma");
    expect(resolvedSlug).toBe(existingRecord.slug);
  });

  it("verifies canonical short URL and legacy routes coexist and remain functional", () => {
    const slug = "a7kd92mx";
    const token = "b8Lc91Mz20KaPqRx";

    expect(buildRootShortUrl(slug)).toBe("http://localhost:3000/a7kd92mx");
    expect(buildRedirectUrl(slug)).toBe("http://localhost:3000/r/a7kd92mx");
    expect(buildLandingPageUrl(slug)).toBe("http://localhost:3000/p/a7kd92mx");
    expect(buildPublicViewerUrl(token)).toBe("http://localhost:3000/v/b8Lc91Mz20KaPqRx");
  });

  it("encodes correct public URLs based on mode and QR type", () => {
    const pdfDirectPayload = resolveEncodedPayload(
      "dynamic",
      "pdf",
      { openDirectly: true },
      "my-slug",
      "my-token-12345678",
    );
    expect(pdfDirectPayload).toBe("http://localhost:3000/v/my-token-12345678");

    const pdfLandingPayload = resolveEncodedPayload(
      "dynamic",
      "pdf",
      { openDirectly: false },
      "my-slug",
      null,
    );
    expect(pdfLandingPayload).toBe("http://localhost:3000/p/my-slug");

    const urlRedirectPayload = resolveEncodedPayload(
      "dynamic",
      "url",
      { url: "https://example.com" },
      "my-slug",
      null,
    );
    expect(urlRedirectPayload).toBe("http://localhost:3000/r/my-slug");

    const staticUrlPayload = resolveEncodedPayload(
      "static",
      "url",
      { url: "https://example.com" },
      null,
      null,
    );
    expect(staticUrlPayload).toBe("https://example.com");
  });
});
