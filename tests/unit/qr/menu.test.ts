import { describe, expect, it } from "vitest";
import { menuQrSchema } from "@/lib/validation/qr";
import { buildMenuPayload } from "@/lib/qr/payload-builders";

describe("menuQrSchema", () => {
  it("accepts a title with at least one item", () => {
    const result = menuQrSchema.safeParse({
      title: "Dinner Menu",
      items: [{ name: "Burger", price: "$12" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an item with a photo", () => {
    const result = menuQrSchema.safeParse({
      title: "Dinner Menu",
      items: [
        {
          name: "Burger",
          photo: {
            path: "user-1/asset-1/burger.jpg",
            fileName: "burger.jpg",
            sizeBytes: 1000,
            mimeType: "image/jpeg",
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a title with no items", () => {
    expect(menuQrSchema.safeParse({ title: "Dinner Menu", items: [] }).success).toBe(false);
  });

  it("rejects an item with an empty name", () => {
    const result = menuQrSchema.safeParse({
      title: "Dinner Menu",
      items: [{ name: "" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("buildMenuPayload", () => {
  it("returns the title — never actually encoded into a QR image", () => {
    expect(buildMenuPayload({ title: "Dinner Menu", items: [] })).toBe("Dinner Menu");
  });
});
