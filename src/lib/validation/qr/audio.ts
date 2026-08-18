import { z } from "zod";

/**
 * Optional artwork was scoped out for now: the master prompt allows it as
 * optional, and artwork is an *image*, which would need a second bucket
 * (`qr-gallery`, not `qr-media` — `qr-media`'s own `allowed_mime_types`
 * is audio-only, Module 1.5) for a single-type QR. The landing page shows
 * a generic audio icon instead; a real artwork field is a small, additive
 * follow-up if ever needed, not a redesign.
 */
export const audioQrSchema = z.object({
  path: z.string().min(1, "Upload an audio file"),
  fileName: z.string().min(1),
  sizeBytes: z.number().nonnegative(),
  mimeType: z.enum(["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg"]),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
});

export type AudioQrInput = z.infer<typeof audioQrSchema>;
