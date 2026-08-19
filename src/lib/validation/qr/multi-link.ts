import { z } from "zod";
import { qrLinkSchema } from "@/lib/validation/qr/shared";

/**
 * The bare "link-in-bio" type — just a title and an ordered link list, no
 * avatar/description/social icons/theme (that's `social`'s job). Keeping
 * these two types genuinely distinct in scope rather than giving them the
 * same schema under two names.
 */
export const multiLinkQrSchema = z.object({
  title: z.string().trim().min(1, "Give this page a title").max(120),
  links: z.array(qrLinkSchema).min(1, "Add at least one link").max(30),
});

export type MultiLinkQrInput = z.infer<typeof multiLinkQrSchema>;
