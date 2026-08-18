import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

async function loadSignedAssetUrl(createSignedUrlResult: { data?: unknown; error?: unknown }) {
  const { createClient } = await import("@/lib/supabase/server");
  vi.mocked(createClient).mockResolvedValue({
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(() => Promise.resolve(createSignedUrlResult)),
      })),
    },
  } as never);
  return import("@/lib/qr/signed-asset-url");
}

describe("createSignedAssetUrl", () => {
  it("returns the signed URL on success", async () => {
    const { createSignedAssetUrl } = await loadSignedAssetUrl({
      data: { signedUrl: "https://storage.example/signed?token=abc" },
      error: null,
    });

    expect(await createSignedAssetUrl("qr-documents", "u/a/menu.pdf")).toBe(
      "https://storage.example/signed?token=abc",
    );
  });

  it("returns null (never throws) when RLS blocks the read — e.g. a paused QR", async () => {
    const { createSignedAssetUrl } = await loadSignedAssetUrl({
      data: null,
      error: { message: "Object not found" },
    });

    expect(await createSignedAssetUrl("qr-documents", "u/a/menu.pdf")).toBeNull();
  });

  it("returns null (never throws) when createClient itself rejects", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockRejectedValue(new Error("no cookies context"));
    const { createSignedAssetUrl } = await import("@/lib/qr/signed-asset-url");

    expect(await createSignedAssetUrl("qr-documents", "u/a/menu.pdf")).toBeNull();
  });
});
