import { z } from "zod";

export const vcardQrSchema = z
  .object({
    firstName: z.string().trim().max(100).optional(),
    lastName: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(30).optional(),
    mobile: z.string().trim().max(30).optional(),
    email: z.string().trim().email().optional().or(z.literal("")),
    website: z.string().trim().url().optional().or(z.literal("")),
    company: z.string().trim().max(100).optional(),
    title: z.string().trim().max(100).optional(),
  })
  .refine((data) => !!data.firstName || !!data.lastName, {
    message: "Enter a first or last name",
    path: ["firstName"],
  });

export type VCardQrInput = z.infer<typeof vcardQrSchema>;
