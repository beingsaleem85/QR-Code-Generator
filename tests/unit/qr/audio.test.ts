import { describe, expect, it } from "vitest";
import { audioQrSchema } from "@/lib/validation/qr";
import { buildAudioPayload } from "@/lib/qr/payload-builders";

const AUDIO = {
  path: "user-1/asset-1/track.mp3",
  fileName: "track.mp3",
  sizeBytes: 100,
  mimeType: "audio/mpeg" as const,
};

describe("audioQrSchema", () => {
  it("accepts a real upload with no title/description", () => {
    expect(audioQrSchema.safeParse(AUDIO).success).toBe(true);
  });

  it("accepts an optional title and description", () => {
    const result = audioQrSchema.safeParse({
      ...AUDIO,
      title: "My Podcast",
      description: "Episode 1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when no file has been uploaded yet", () => {
    expect(audioQrSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an unsupported audio mime type", () => {
    expect(audioQrSchema.safeParse({ ...AUDIO, mimeType: "audio/flac" }).success).toBe(false);
  });
});

describe("buildAudioPayload", () => {
  it("returns the storage path", () => {
    expect(buildAudioPayload(AUDIO)).toBe("user-1/asset-1/track.mp3");
  });
});
