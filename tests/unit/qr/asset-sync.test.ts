import { describe, expect, it, vi } from "vitest";
import { syncQrAssets, duplicateQrAssets } from "@/lib/qr/asset-sync";

function createChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    in: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    upsert: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  return chain;
}

function mockSupabase(fromResults: { data?: unknown; error?: unknown }[]) {
  const chains = fromResults.map(createChain);
  const from = vi.fn();
  chains.forEach((chain) => from.mockReturnValueOnce(chain));
  const remove = vi.fn(() => Promise.resolve({ data: null, error: null as unknown }));
  const copy = vi.fn(() => Promise.resolve({ data: null, error: null as unknown }));
  const storageFrom = vi.fn(() => ({ remove, copy }));
  return { from, storage: { from: storageFrom }, remove, copy, storageFrom };
}

describe("syncQrAssets", () => {
  it("upserts a new asset when there's nothing to replace", async () => {
    const client = mockSupabase([
      { data: [], error: null }, // no existing qr_assets rows
      { data: null, error: null }, // the upsert
    ]);

    await syncQrAssets(client as never, "user-1", "qr-1", "pdf", {
      path: "user-1/asset-1/menu.pdf",
      fileName: "menu.pdf",
      sizeBytes: 100,
      mimeType: "application/pdf",
    });

    const upsertChain = client.from.mock.results[1].value;
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          user_id: "user-1",
          qr_code_id: "qr-1",
          asset_type: "pdf_document",
          bucket: "qr-documents",
          path: "user-1/asset-1/menu.pdf",
        }),
      ],
      { onConflict: "bucket,path" },
    );
    expect(client.storageFrom).not.toHaveBeenCalled();
  });

  it("removes the old Storage object and qr_assets row when the file is replaced", async () => {
    const client = mockSupabase([
      {
        data: [{ id: "old-asset", bucket: "qr-documents", path: "user-1/old/menu-v1.pdf" }],
        error: null,
      },
      { data: null, error: null }, // the stale delete
      { data: null, error: null }, // the new upsert
    ]);

    await syncQrAssets(client as never, "user-1", "qr-1", "pdf", {
      path: "user-1/asset-2/menu-v2.pdf",
      fileName: "menu-v2.pdf",
      sizeBytes: 200,
      mimeType: "application/pdf",
    });

    expect(client.storageFrom).toHaveBeenCalledWith("qr-documents");
    expect(client.remove).toHaveBeenCalledWith(["user-1/old/menu-v1.pdf"]);

    const deleteChain = client.from.mock.results[1].value;
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(deleteChain.in).toHaveBeenCalledWith("id", ["old-asset"]);
  });

  it("removes the asset entirely when content no longer references any file", async () => {
    const client = mockSupabase([
      {
        data: [{ id: "old-asset", bucket: "qr-documents", path: "user-1/old/menu-v1.pdf" }],
        error: null,
      },
      { data: null, error: null },
    ]);

    await syncQrAssets(client as never, "user-1", "qr-1", "pdf", {});

    expect(client.remove).toHaveBeenCalledWith(["user-1/old/menu-v1.pdf"]);
    // Only 2 .from() calls: the existing-rows select and the stale delete —
    // no upsert, since there's nothing to keep.
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it("does nothing for a QR type that doesn't need storage", async () => {
    const client = mockSupabase([{ data: [], error: null }]);

    await syncQrAssets(client as never, "user-1", "qr-1", "url", { url: "https://example.com" });

    expect(client.from).toHaveBeenCalledTimes(1); // just the (empty) existing-rows check
    expect(client.storageFrom).not.toHaveBeenCalled();
  });

  it("upserts every image in a gallery, in bucket qr-gallery", async () => {
    const client = mockSupabase([
      { data: [], error: null },
      { data: null, error: null },
    ]);

    await syncQrAssets(client as never, "user-1", "qr-1", "images", {
      images: [
        { path: "user-1/a/1.jpg", fileName: "1.jpg", sizeBytes: 10, mimeType: "image/jpeg" },
        { path: "user-1/a/2.jpg", fileName: "2.jpg", sizeBytes: 20, mimeType: "image/jpeg" },
      ],
    });

    const upsertChain = client.from.mock.results[1].value;
    const upserted = upsertChain.upsert.mock.calls[0][0];
    expect(upserted).toHaveLength(2);
    expect(upserted[0]).toMatchObject({ bucket: "qr-gallery", path: "user-1/a/1.jpg" });
    expect(upserted[1]).toMatchObject({ bucket: "qr-gallery", path: "user-1/a/2.jpg" });
  });

  it("removes a gallery image no longer referenced after reordering/deletion", async () => {
    const client = mockSupabase([
      {
        data: [
          { id: "img-1", bucket: "qr-gallery", path: "user-1/a/1.jpg" },
          { id: "img-2", bucket: "qr-gallery", path: "user-1/a/2.jpg" },
        ],
        error: null,
      },
      { data: null, error: null },
      { data: null, error: null },
    ]);

    // Only image 2 remains in the new content.
    await syncQrAssets(client as never, "user-1", "qr-1", "images", {
      images: [
        { path: "user-1/a/2.jpg", fileName: "2.jpg", sizeBytes: 20, mimeType: "image/jpeg" },
      ],
    });

    expect(client.remove).toHaveBeenCalledWith(["user-1/a/1.jpg"]);
    const deleteChain = client.from.mock.results[1].value;
    expect(deleteChain.in).toHaveBeenCalledWith("id", ["img-1"]);
  });

  it("upserts an audio asset in bucket qr-media", async () => {
    const client = mockSupabase([
      { data: [], error: null },
      { data: null, error: null },
    ]);

    await syncQrAssets(client as never, "user-1", "qr-1", "audio", {
      path: "user-1/a/track.mp3",
      fileName: "track.mp3",
      sizeBytes: 100,
      mimeType: "audio/mpeg",
    });

    const upsertChain = client.from.mock.results[1].value;
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      [expect.objectContaining({ asset_type: "audio_track", bucket: "qr-media" })],
      { onConflict: "bucket,path" },
    );
  });

  it("upserts only the menu items that have a photo, in bucket qr-gallery", async () => {
    const client = mockSupabase([
      { data: [], error: null },
      { data: null, error: null },
    ]);

    await syncQrAssets(client as never, "user-1", "qr-1", "menu", {
      title: "Dinner Menu",
      items: [
        { name: "Burger", price: "$12" },
        {
          name: "Fries",
          photo: {
            path: "user-1/a/fries.jpg",
            fileName: "fries.jpg",
            sizeBytes: 30,
            mimeType: "image/jpeg",
          },
        },
      ],
    });

    const upsertChain = client.from.mock.results[1].value;
    const upserted = upsertChain.upsert.mock.calls[0][0];
    expect(upserted).toHaveLength(1);
    expect(upserted[0]).toMatchObject({
      asset_type: "menu_item_photo",
      bucket: "qr-gallery",
      path: "user-1/a/fries.jpg",
    });
  });
});

describe("duplicateQrAssets", () => {
  it("copies a single file (pdf) to a new path and rewrites the returned content", async () => {
    const client = mockSupabase([{ data: null, error: null }]);

    const result = await duplicateQrAssets(client as never, "user-1", "new-qr-1", "pdf", {
      path: "user-1/orig/menu.pdf",
      fileName: "menu.pdf",
      sizeBytes: 100,
      mimeType: "application/pdf",
    });

    expect(client.copy).toHaveBeenCalledWith(
      "user-1/orig/menu.pdf",
      expect.stringMatching(/^user-1\/[0-9a-f-]+\/menu\.pdf$/),
    );
    expect(client.storageFrom).toHaveBeenCalledWith("qr-documents");
    expect(result.path).not.toBe("user-1/orig/menu.pdf");
    expect(result.path).toMatch(/^user-1\/[0-9a-f-]+\/menu\.pdf$/);

    const insertChain = client.from.mock.results[0].value;
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        qr_code_id: "new-qr-1",
        asset_type: "pdf_document",
        bucket: "qr-documents",
      }),
    );
  });

  it("copies every image in a gallery and rewrites each path independently", async () => {
    const client = mockSupabase([
      { data: null, error: null },
      { data: null, error: null },
    ]);

    const result = await duplicateQrAssets(client as never, "user-1", "new-qr-1", "images", {
      images: [
        { path: "user-1/a/1.jpg", fileName: "1.jpg", sizeBytes: 10, mimeType: "image/jpeg" },
        { path: "user-1/a/2.jpg", fileName: "2.jpg", sizeBytes: 20, mimeType: "image/jpeg" },
      ],
    });

    expect(client.copy).toHaveBeenCalledTimes(2);
    expect((result.images as { path: string }[])[0].path).not.toBe("user-1/a/1.jpg");
    expect((result.images as { path: string }[])[1].path).not.toBe("user-1/a/2.jpg");
  });

  it("rewrites a menu item's photo path, leaving items with no photo untouched", async () => {
    const client = mockSupabase([{ data: null, error: null }]);

    const result = await duplicateQrAssets(client as never, "user-1", "new-qr-1", "menu", {
      title: "Menu",
      items: [
        { name: "Fries", price: "$5" },
        {
          name: "Burger",
          photo: {
            path: "user-1/a/burger.jpg",
            fileName: "burger.jpg",
            sizeBytes: 30,
            mimeType: "image/jpeg",
          },
        },
      ],
    });

    const items = result.items as { name: string; photo?: { path: string } }[];
    expect(items[0].photo).toBeUndefined();
    expect(items[1].photo?.path).not.toBe("user-1/a/burger.jpg");
  });

  it("returns the original content unchanged for a type with no storage-backed assets", async () => {
    const client = mockSupabase([]);

    const result = await duplicateQrAssets(client as never, "user-1", "new-qr-1", "url", {
      url: "https://example.com",
    });

    expect(result).toEqual({ url: "https://example.com" });
    expect(client.copy).not.toHaveBeenCalled();
  });

  it("skips (doesn't rewrite) an asset whose copy fails, leaving its original path", async () => {
    const client = mockSupabase([{ data: null, error: null }]);
    client.copy.mockResolvedValueOnce({ data: null, error: { message: "copy failed" } });

    const result = await duplicateQrAssets(client as never, "user-1", "new-qr-1", "pdf", {
      path: "user-1/orig/menu.pdf",
      fileName: "menu.pdf",
      sizeBytes: 100,
      mimeType: "application/pdf",
    });

    expect(result.path).toBe("user-1/orig/menu.pdf");
    expect(client.from).not.toHaveBeenCalled();
  });
});
