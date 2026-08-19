import type { MenuQrInput } from "@/lib/validation/qr";

/** Never actually encoded — see `buildAppPayload`'s doc comment for why. */
export function buildMenuPayload(input: MenuQrInput): string {
  return input.title;
}
