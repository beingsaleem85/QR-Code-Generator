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
  path: z.string().min(1, "Upload a PDF file").max(500),
  fileName: z.string().min(1).max(255),
  sizeBytes: z.number().nonnegative(),
  mimeType: z.literal("application/pdf"),
  /**
   * When true, `/p/[slug]` skips the landing page and renders the
   * full-screen in-app `PdfViewer` instead (see
   * `src/components/landing/pdf-viewer/PdfViewer.tsx`, which loads the
   * current PDF from the same-origin `/api/public-pdf/[slug]` proxy).
   * Optional + defaulted so an existing record's `payload_data` — saved
   * before this field existed — parses to `false` with no migration/
   * backfill needed, exactly the same "missing means off" behavior as if
   * the record had been saved with it unchecked.
   */
  openDirectly: z.boolean().optional().default(false),
});

export type PdfQrInput = z.infer<typeof pdfQrSchema>;
