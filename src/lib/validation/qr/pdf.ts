import { z } from "zod";

/**
 * Populated by the upload flow (`src/lib/qr/asset-upload.ts`), never typed
 * by hand — the content form uploads the file first, then calls `onChange`
 * with this shape. `mimeType`/`sizeBytes` mirror what the Storage bucket
 * itself already enforces (Module 1.5's `qr-documents` bucket: PDF only,
 * 20MB max) — this schema just confirms a real upload actually completed
 * before the QR can be saved.
 */
export const pdfQrSchema = z.object({
  path: z.string().min(1, "Upload a PDF file"),
  fileName: z.string().min(1),
  sizeBytes: z.number().nonnegative(),
  mimeType: z.literal("application/pdf"),
});

export type PdfQrInput = z.infer<typeof pdfQrSchema>;
