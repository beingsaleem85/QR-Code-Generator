import { z } from "zod";

/**
 * Validates payload for 2D Barcode (Data Matrix ECC 200 / GS1 standard).
 * Supports standard ASCII/UTF-8 data or GS1 application identifier data.
 */
export const barcode2dQrSchema = z.object({
  data: z
    .string()
    .min(1, "Barcode content cannot be empty")
    .max(1000, "Maximum 1000 characters for Data Matrix ECC 200"),
  encoding: z.enum(["standard", "gs1"]).optional(),
});

export type Barcode2dQrInput = z.infer<typeof barcode2dQrSchema>;
