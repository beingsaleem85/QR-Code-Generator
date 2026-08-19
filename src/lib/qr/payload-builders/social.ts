import type { SocialQrInput } from "@/lib/validation/qr";

/** Never actually encoded — see `buildAppPayload`'s doc comment for why. */
export function buildSocialPayload(input: SocialQrInput): string {
  return input.title;
}
