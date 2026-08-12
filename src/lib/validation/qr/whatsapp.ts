import { z } from "zod";
import { phoneQrSchema } from "./phone";

export const whatsappQrSchema = phoneQrSchema.extend({
  message: z.string().trim().max(2000).optional(),
});

export type WhatsAppQrInput = z.infer<typeof whatsappQrSchema>;
