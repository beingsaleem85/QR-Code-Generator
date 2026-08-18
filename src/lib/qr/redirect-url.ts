/**
 * A dynamic QR's printed image always encodes this app's own `/r/[slug]`
 * URL, never the raw destination directly — that indirection is the whole
 * point of "dynamic" (Module 3.6): the destination can change later without
 * reprinting the code, and every scan can be counted.
 */
export function buildRedirectUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/r/${slug}`;
}

/**
 * Defense-in-depth against open-redirect abuse (Module 3.6 requirement):
 * only ever redirect to a well-formed http(s) URL. The `url` QR type's own
 * Zod schema already enforces this at input time, but the redirect route
 * checks again here rather than trusting stored data unconditionally.
 */
export function isSafeRedirectTarget(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
