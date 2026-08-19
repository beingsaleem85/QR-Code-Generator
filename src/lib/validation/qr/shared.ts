import { z } from "zod";

const HAS_SCHEME = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//;

/**
 * Same http(s)-only, auto-prepend-https validation as `urlQrSchema`/
 * `videoQrSchema`, factored out for Module 3.9's several link-collection
 * types (app, social, multi_link) rather than copy-pasted a third+ time.
 */
function httpUrlSchema(message: string) {
  return z
    .string()
    .trim()
    .min(1, message)
    .transform((value) => (HAS_SCHEME.test(value) ? value : `https://${value}`))
    .refine((value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a valid http(s) URL");
}

export function requiredHttpUrl(message = "Enter a URL") {
  return httpUrlSchema(message);
}

export function optionalHttpUrl() {
  return z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      return HAS_SCHEME.test(value) ? value : `https://${value}`;
    })
    .refine((value) => {
      if (value === undefined) return true;
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a valid http(s) URL");
}

/** One entry in an ordered list of links — the shape every 3.9 link-collection type shares. */
export const qrLinkSchema = z.object({
  label: z.string().trim().min(1, "Enter a label").max(80),
  url: requiredHttpUrl(),
});

export type QrLink = z.infer<typeof qrLinkSchema>;
