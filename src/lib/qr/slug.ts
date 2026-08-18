/**
 * Short, URL-safe random slugs for dynamic QR codes. `qr_codes.slug` is
 * required (and globally unique) for `mode = 'dynamic'` rows per the
 * Module 1.4 schema's own check constraint — actually resolving a slug
 * through `/r/[slug]` is Module 3.6's job, but the identifier itself has
 * to exist the moment a dynamic QR is first saved (Module 3.5), so it's
 * generated here.
 */
const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_LENGTH = 8;

export function generateRandomSlug(length = SLUG_LENGTH): string {
  let slug = "";
  for (let i = 0; i < length; i++) {
    slug += SLUG_ALPHABET[Math.floor(Math.random() * SLUG_ALPHABET.length)];
  }
  return slug;
}
