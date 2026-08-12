import { z } from "zod";

export const textQrSchema = z.object({
  text: z.string().trim().min(1, "Enter some text").max(2000, "Text is too long"),
});

export type TextQrInput = z.infer<typeof textQrSchema>;
