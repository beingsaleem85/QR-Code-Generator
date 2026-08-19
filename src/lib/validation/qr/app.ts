import { z } from "zod";
import { optionalHttpUrl } from "@/lib/validation/qr/shared";

/**
 * At least one of the three destinations is required — a page with none of
 * them would have nothing for the device-aware CTA to point at.
 */
export const appQrSchema = z
  .object({
    title: z.string().trim().min(1, "Give this page a title").max(120),
    iosUrl: optionalHttpUrl(),
    androidUrl: optionalHttpUrl(),
    fallbackUrl: optionalHttpUrl(),
  })
  .refine((data) => data.iosUrl || data.androidUrl || data.fallbackUrl, {
    message: "Add an App Store link, a Google Play link, or a fallback website",
    path: ["fallbackUrl"],
  });

export type AppQrInput = z.infer<typeof appQrSchema>;
