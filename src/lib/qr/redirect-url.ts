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
 * The landing-page counterpart to `buildRedirectUrl` (Module 3.8) — used
 * instead of `/r/[slug]` for dynamic QR types that need a hosted
 * experience rather than a plain redirect (`needsLandingPage: true` in the
 * registry: pdf, image gallery, audio, video, and Module 3.9's social/
 * multi-link/menu/feedback types).
 */
export function buildLandingPageUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/p/${slug}`;
}

/**
 * The opaque-token counterpart to `buildLandingPageUrl` — used instead of
 * `/p/[slug]` for a PDF QR created with "Open PDF directly" already
 * enabled, so the printed code encodes a random, non-guessable identifier
 * (`src/lib/qr/public-token.ts`) rather than the QR's ordinary slug.
 */
export function buildPublicViewerUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/v/${token}`;
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
