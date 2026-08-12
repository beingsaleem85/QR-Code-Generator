import { z } from "zod";

const PHONE_PATTERN = /^[+\d][\d\s().-]{1,19}$/;

export const phoneQrSchema = z.object({
  phone: z.string().trim().regex(PHONE_PATTERN, "Enter a valid phone number"),
});

export type PhoneQrInput = z.infer<typeof phoneQrSchema>;
