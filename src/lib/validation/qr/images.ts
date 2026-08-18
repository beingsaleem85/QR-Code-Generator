import { z } from "zod";

/**
 * One entry per uploaded image, in display order — array order *is* the
 * gallery order, so there's no separate `sortOrder` field to keep in sync.
 * `caption` is the only field a user actually types; everything else is
 * populated by the upload flow (`src/lib/qr/asset-upload.ts`).
 */
const galleryImageSchema = z.object({
  path: z.string().min(1),
  fileName: z.string().min(1),
  sizeBytes: z.number().nonnegative(),
  mimeType: z.string().min(1),
  caption: z.string().max(200).optional(),
});

export const imagesQrSchema = z.object({
  images: z.array(galleryImageSchema).min(1, "Add at least one image"),
});

export type GalleryImage = z.infer<typeof galleryImageSchema>;
export type ImagesQrInput = z.infer<typeof imagesQrSchema>;
