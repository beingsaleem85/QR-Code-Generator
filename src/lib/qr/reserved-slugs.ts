/**
 * Central registry of reserved slugs and system paths to prevent custom
 * or generated dynamic QR slugs from shadowing application routes.
 */
export const RESERVED_SLUGS = new Set([
  "api",
  "auth",
  "dashboard",
  "pricing",
  "features",
  "faq",
  "terms",
  "privacy",
  "login",
  "signup",
  "forgot-password",
  "reset-password",
  "dynamic-qr",
  "static-qr",
  "qr-generator",
  "qr-types",
  "r",
  "p",
  "v",
  "_next",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
]);

export function isReservedSlug(slug: string): boolean {
  if (!slug || typeof slug !== "string") return true;
  return RESERVED_SLUGS.has(slug.trim().toLowerCase());
}
