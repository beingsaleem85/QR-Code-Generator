import { z } from "zod";

export const eventQrSchema = z
  .object({
    title: z.string().trim().min(1, "Enter an event title").max(200),
    start: z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid start date/time"),
    // Plain optional string, no per-field date refine — the form always
    // submits a string for `end` (never `undefined`) even when left blank,
    // so a refine placed directly on this field would run on `""` too and
    // Zod's `.optional()` only exempts `undefined`. The date-format check
    // instead lives in the object-level refine below, guarded by
    // `!data.end` (true for both `undefined` and `""`), the same way the
    // start/end ordering check already has to be.
    end: z.string().trim().optional(),
    location: z.string().trim().max(200).optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .refine((data) => !data.end || !Number.isNaN(Date.parse(data.end)), {
    message: "Enter a valid end date/time",
    path: ["end"],
  })
  .refine((data) => !data.end || Date.parse(data.end) >= Date.parse(data.start), {
    message: "End must be after start",
    path: ["end"],
  });

export type EventQrInput = z.infer<typeof eventQrSchema>;
