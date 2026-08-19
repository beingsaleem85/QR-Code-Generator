import { z } from "zod";

/**
 * Same upload-result shape as `pdfQrSchema`/`galleryImageSchema` — populated
 * by `uploadQrAsset("menu", file)`, never typed by hand. Optional: a menu
 * item is still valid with no photo.
 */
const menuItemPhotoSchema = z.object({
  path: z.string().min(1).max(500),
  fileName: z.string().min(1).max(255),
  sizeBytes: z.number().nonnegative(),
  mimeType: z.string().min(1).max(100),
});

/**
 * `category` is a free-text label rather than a nested category array —
 * flat items grouped by a shared string at render time is simpler to build
 * and edit than reordering categories-of-items, and covers the same
 * "grouped menu" experience. `price` is a string (not a number) since
 * display formatting (currency symbol, "Market price", ranges) varies more
 * than a plain number can express.
 */
const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Enter an item name").max(120),
  description: z.string().trim().max(300).optional(),
  price: z.string().trim().max(30).optional(),
  category: z.string().trim().max(60).optional(),
  photo: menuItemPhotoSchema.optional(),
});

export const menuQrSchema = z.object({
  title: z.string().trim().min(1, "Give this menu a title").max(120),
  description: z.string().trim().max(300).optional(),
  items: z.array(menuItemSchema).min(1, "Add at least one menu item").max(100),
});

export type MenuItem = z.infer<typeof menuItemSchema>;
export type MenuQrInput = z.infer<typeof menuQrSchema>;
