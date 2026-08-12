import { z } from "zod";

const HAS_SCHEME = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//;

export const urlQrSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Enter a URL")
    .transform((value) => (HAS_SCHEME.test(value) ? value : `https://${value}`))
    .refine((value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a valid http(s) URL"),
});

export type UrlQrInput = z.infer<typeof urlQrSchema>;
