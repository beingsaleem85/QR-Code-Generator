// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssetValidationError, uploadQrAsset } from "@/lib/qr/asset-upload";

const mockUser = { id: "user-1" };

function mockBrowserClient(options: {
  user?: typeof mockUser | null;
  uploadError?: { message: string } | null;
}) {
  const upload = vi.fn(() => Promise.resolve({ data: null, error: options.uploadError ?? null }));
  return {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: options.user ?? null } })) },
    storage: { from: vi.fn(() => ({ upload })) },
    __upload: upload,
  };
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

function pdfFile(name: string, sizeBytes: number) {
  const bytes = new Uint8Array(sizeBytes);
  return new File([bytes], name, { type: "application/pdf" });
}

describe("uploadQrAsset", () => {
  it("uploads a valid PDF and returns its reference", async () => {
    const client = mockBrowserClient({ user: mockUser });
    const { createClient } = await import("@/lib/supabase/client");
    vi.mocked(createClient).mockReturnValue(client as never);

    const file = pdfFile("Menu.pdf", 1024);
    const result = await uploadQrAsset("pdf", file);

    expect(result.fileName).toBe("Menu.pdf");
    expect(result.sizeBytes).toBe(1024);
    expect(result.mimeType).toBe("application/pdf");
    expect(result.path).toMatch(/^user-1\/[0-9a-f-]+\/menu\.pdf$/);
    expect(client.storage.from).toHaveBeenCalledWith("qr-documents");
  });

  it("rejects an oversized file before ever attempting to upload", async () => {
    const client = mockBrowserClient({ user: mockUser });
    const { createClient } = await import("@/lib/supabase/client");
    vi.mocked(createClient).mockReturnValue(client as never);

    const tooLarge = pdfFile("big.pdf", 21 * 1024 * 1024);
    await expect(uploadQrAsset("pdf", tooLarge)).rejects.toThrow(AssetValidationError);
    expect(client.__upload).not.toHaveBeenCalled();
  });

  it("rejects a file of the wrong type before ever attempting to upload", async () => {
    const client = mockBrowserClient({ user: mockUser });
    const { createClient } = await import("@/lib/supabase/client");
    vi.mocked(createClient).mockReturnValue(client as never);

    const wrongType = new File([new Uint8Array(10)], "photo.png", { type: "image/png" });
    await expect(uploadQrAsset("pdf", wrongType)).rejects.toThrow(AssetValidationError);
    expect(client.__upload).not.toHaveBeenCalled();
  });

  it("requires an authenticated session", async () => {
    const client = mockBrowserClient({ user: null });
    const { createClient } = await import("@/lib/supabase/client");
    vi.mocked(createClient).mockReturnValue(client as never);

    await expect(uploadQrAsset("pdf", pdfFile("menu.pdf", 100))).rejects.toThrow(
      AssetValidationError,
    );
  });

  it("surfaces a real Storage error", async () => {
    const client = mockBrowserClient({
      user: mockUser,
      uploadError: { message: "quota exceeded" },
    });
    const { createClient } = await import("@/lib/supabase/client");
    vi.mocked(createClient).mockReturnValue(client as never);

    await expect(uploadQrAsset("pdf", pdfFile("menu.pdf", 100))).rejects.toThrow("quota exceeded");
  });
});
