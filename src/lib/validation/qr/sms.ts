import { z } from "zod";
import { phoneQrSchema } from "./phone";

export const smsQrSchema = phoneQrSchema.extend({
  message: z.string().trim().max(2000).optional(),
});

export type SmsQrInput = z.infer<typeof smsQrSchema>;
