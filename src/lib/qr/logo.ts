/**
 * Client-side-only logo handling for the design panel. Deliberately does
 * NOT use Supabase Storage — a design logo only needs to exist long enough
 * to be composited into this session's preview/download; it isn't
 * persisted anywhere until the QR code itself is saved (Module 3.5), at
 * which point `design_config` — including this data URL — is written as
 * part of that save. That's a different, later requirement than needing
 * Storage *now* just to preview/download, which is what Module 3.8's own
 * "File-Based QR Types" scope is actually about (QR *content*, not design
 * assets). Revises the Module 2.4/2.9-era assumption that logo upload had
 * to wait for Module 3.8.
 */

const MAX_LOGO_DIMENSION = 256;

/** Reads an image file, downscales it if oversized, and returns a compact PNG data URL. */
export function readLogoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, MAX_LOGO_DIMENSION / Math.max(image.width, image.height));
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D context unavailable"));
          return;
        }
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = () => reject(new Error("Could not read the selected image"));
      image.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read the selected file"));
    reader.readAsDataURL(file);
  });
}
