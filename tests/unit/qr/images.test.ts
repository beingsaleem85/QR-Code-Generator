import { describe, expect, it } from "vitest";
import { imagesQrSchema } from "@/lib/validation/qr";
import { buildImagesPayload } from "@/lib/qr/payload-builders";

const IMAGE = {
  path: "user-1/asset-1/photo.jpg",
  fileName: "photo.jpg",
  sizeBytes: 100,
  mimeType: "image/jpeg",
};

describe("imagesQrSchema", () => {
  it("accepts one or more uploaded images", () => {
    expect(imagesQrSchema.safeParse({ images: [IMAGE] }).success).toBe(true);
    expect(imagesQrSchema.safeParse({ images: [IMAGE, { ...IMAGE, path: "b" }] }).success).toBe(
      true,
    );
  });

  it("rejects an empty gallery", () => {
    expect(imagesQrSchema.safeParse({ images: [] }).success).toBe(false);
    expect(imagesQrSchema.safeParse({}).success).toBe(false);
  });

  it("accepts an optional caption per image", () => {
    const result = imagesQrSchema.safeParse({ images: [{ ...IMAGE, caption: "Front view" }] });
    expect(result.success).toBe(true);
  });
});

describe("buildImagesPayload", () => {
  it("joins every image's path", () => {
    expect(
      buildImagesPayload({ images: [IMAGE, { ...IMAGE, path: "user-1/asset-2/photo2.jpg" }] }),
    ).toBe("user-1/asset-1/photo.jpg,user-1/asset-2/photo2.jpg");
  });
});
