import type { FeedbackQrInput } from "@/lib/validation/qr";

/** Never actually encoded — see `buildAppPayload`'s doc comment for why. */
export function buildFeedbackPayload(input: FeedbackQrInput): string {
  return input.title;
}
