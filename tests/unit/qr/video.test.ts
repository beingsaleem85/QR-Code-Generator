import { describe, expect, it } from "vitest";
import { videoQrSchema } from "@/lib/validation/qr";
import { buildVideoPayload } from "@/lib/qr/payload-builders";
import { toEmbeddableVideoUrl } from "@/lib/qr/video-embed";

describe("videoQrSchema", () => {
  it("accepts a bare domain and adds https", () => {
    const result = videoQrSchema.safeParse({ url: "youtube.com/watch?v=abc123" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.url).toBe("https://youtube.com/watch?v=abc123");
  });

  it("rejects an empty URL", () => {
    expect(videoQrSchema.safeParse({ url: "" }).success).toBe(false);
  });

  it("accepts an optional title", () => {
    expect(videoQrSchema.safeParse({ url: "https://vimeo.com/123", title: "Demo" }).success).toBe(
      true,
    );
  });
});

describe("buildVideoPayload", () => {
  it("returns the URL directly — this is what a static video QR encodes", () => {
    expect(buildVideoPayload({ url: "https://youtube.com/watch?v=abc123" })).toBe(
      "https://youtube.com/watch?v=abc123",
    );
  });
});

describe("toEmbeddableVideoUrl", () => {
  it("converts a standard YouTube watch URL", () => {
    expect(toEmbeddableVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("converts a youtu.be short URL", () => {
    expect(toEmbeddableVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("converts a Vimeo URL", () => {
    expect(toEmbeddableVideoUrl("https://vimeo.com/76979871")).toBe(
      "https://player.vimeo.com/video/76979871",
    );
  });

  it("returns null for an unrecognized host", () => {
    expect(toEmbeddableVideoUrl("https://example.com/my-video")).toBeNull();
  });

  it("returns null for a malformed URL", () => {
    expect(toEmbeddableVideoUrl("not a url")).toBeNull();
  });
});
