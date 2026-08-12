import { z } from "zod";

export const emailQrSchema = z.object({
  to: z.string().trim().email("Enter a valid email address"),
  subject: z.string().trim().max(200).optional(),
  body: z.string().trim().max(2000).optional(),
});

export type EmailQrInput = z.infer<typeof emailQrSchema>;
