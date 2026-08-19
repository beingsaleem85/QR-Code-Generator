import { afterEach, describe, expect, it, vi } from "vitest";

const createSignedAssetUrl = vi.fn();

vi.mock("@/lib/qr/signed-asset-url", () => ({ createSignedAssetUrl }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("resolvePdfDirectOpenUrl", () => {
  it("returns null when openDirectly is not true", async () => {
    const { resolvePdfDirectOpenUrl } = await import("@/server/services/pdf-direct-open");

    expect(await resolvePdfDirectOpenUrl({ path: "u/a/menu.pdf", openDirectly: false })).toBeNull();
    expect(createSignedAssetUrl).not.toHaveBeenCalled();
  });

  it("returns null when openDirectly is missing (existing records default to landing-page behavior)", async () => {
    const { resolvePdfDirectOpenUrl } = await import("@/server/services/pdf-direct-open");

    expect(await resolvePdfDirectOpenUrl({ path: "u/a/menu.pdf" })).toBeNull();
    expect(createSignedAssetUrl).not.toHaveBeenCalled();
  });

  it("returns null when no file has been uploaded yet, even with openDirectly true", async () => {
    const { resolvePdfDirectOpenUrl } = await import("@/server/services/pdf-direct-open");

    expect(await resolvePdfDirectOpenUrl({ openDirectly: true })).toBeNull();
    expect(createSignedAssetUrl).not.toHaveBeenCalled();
  });

  it("resolves a fresh signed URL for the qr-documents bucket when enabled", async () => {
    createSignedAssetUrl.mockResolvedValue("https://storage.example/signed?token=abc");
    const { resolvePdfDirectOpenUrl } = await import("@/server/services/pdf-direct-open");

    const result = await resolvePdfDirectOpenUrl({ path: "u/a/menu.pdf", openDirectly: true });

    expect(result).toBe("https://storage.example/signed?token=abc");
    expect(createSignedAssetUrl).toHaveBeenCalledWith("qr-documents", "u/a/menu.pdf");
  });

  it("returns null (falls back to landing page) when signing fails — e.g. a paused QR's RLS blocks it", async () => {
    createSignedAssetUrl.mockResolvedValue(null);
    const { resolvePdfDirectOpenUrl } = await import("@/server/services/pdf-direct-open");

    expect(await resolvePdfDirectOpenUrl({ path: "u/a/menu.pdf", openDirectly: true })).toBeNull();
  });

  it("always re-resolves the path currently in payload_data — proves file replacement works without a new QR", async () => {
    createSignedAssetUrl.mockResolvedValueOnce("https://storage.example/signed?token=A");
    const { resolvePdfDirectOpenUrl } = await import("@/server/services/pdf-direct-open");

    const first = await resolvePdfDirectOpenUrl({ path: "u/a/original.pdf", openDirectly: true });
    expect(first).toBe("https://storage.example/signed?token=A");

    createSignedAssetUrl.mockResolvedValueOnce("https://storage.example/signed?token=B");
    const second = await resolvePdfDirectOpenUrl({
      path: "u/a/replacement.pdf",
      openDirectly: true,
    });
    expect(second).toBe("https://storage.example/signed?token=B");
    expect(createSignedAssetUrl).toHaveBeenNthCalledWith(2, "qr-documents", "u/a/replacement.pdf");
  });
});
