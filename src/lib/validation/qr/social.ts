import { z } from "zod";
import { qrLinkSchema, optionalHttpUrl } from "@/lib/validation/qr/shared";

export const SOCIAL_ICON_PLATFORMS = [
  "twitter",
  "instagram",
  "facebook",
  "linkedin",
  "youtube",
  "tiktok",
  "github",
  "website",
] as const;

const socialIconSchema = z.object({
  platform: z.enum(SOCIAL_ICON_PLATFORMS),
  url: qrLinkSchema.shape.url,
});

export const SOCIAL_THEMES = ["light", "dark", "brand"] as const;

/**
 * The full "business/profile page" experience — avatar, description, an
 * ordered link list, and dedicated platform icons, on top of everything
 * `multiLinkQrSchema` offers. `avatarUrl` is a pasted link to an
 * already-hosted image, not an upload — `social` is `needsStorage: false`
 * in the Module 1.3 registry, a decision this module doesn't revisit.
 */
export const socialQrSchema = z
  .object({
    title: z.string().trim().min(1, "Give this page a title").max(120),
    avatarUrl: optionalHttpUrl(),
    description: z.string().trim().max(300).optional(),
    links: z.array(qrLinkSchema).max(20).default([]),
    icons: z.array(socialIconSchema).max(10).default([]),
    theme: z.enum(SOCIAL_THEMES).default("light"),
  })
  .refine((data) => data.links.length > 0 || data.icons.length > 0, {
    message: "Add at least one link or social icon",
    path: ["links"],
  });

export type SocialQrInput = z.infer<typeof socialQrSchema>;
export type SocialIconPlatform = (typeof SOCIAL_ICON_PLATFORMS)[number];
