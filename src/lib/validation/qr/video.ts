import { z } from "zod";

const HAS_SCHEME = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//;

/**
 * No Storage bucket for video (`needsStorage: false` in the registry) —
 * the master prompt explicitly prefers linking an external host (YouTube,
 * Vimeo, etc.) over self-hosting, to avoid unbounded storage/bandwidth
 * cost. Same http(s)-only validation as `urlQrSchema`, since this is
 * fundamentally the same "a URL, not a file" shape.
 */
export const videoQrSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Enter a video URL")
    .transform((value) => (HAS_SCHEME.test(value) ? value : `https://${value}`))
    .refine((value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a valid http(s) video URL"),
  title: z.string().max(200).optional(),
});

export type VideoQrInput = z.infer<typeof videoQrSchema>;
