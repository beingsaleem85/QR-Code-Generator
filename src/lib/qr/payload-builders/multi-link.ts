import type { MultiLinkQrInput } from "@/lib/validation/qr";

/** Never actually encoded — see `buildAppPayload`'s doc comment for why. */
export function buildMultiLinkPayload(input: MultiLinkQrInput): string {
  return input.title;
}
