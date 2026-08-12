import { z } from "zod";

export const eventQrSchema = z
  .object({
    title: z.string().trim().min(1, "Enter an event title").max(200),
    start: z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid start date/time"),
    end: z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid end date/time")
      .optional(),
    location: z.string().trim().max(200).optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .refine((data) => !data.end || Date.parse(data.end) >= Date.parse(data.start), {
    message: "End must be after start",
    path: ["end"],
  });

export type EventQrInput = z.infer<typeof eventQrSchema>;
