/**
 * Coarse geolocation "if available and legally appropriate" (Module 3.7):
 * reads whichever edge platform's own country header is present rather than
 * calling a geo-IP service — zero added latency, no third-party data
 * sharing, genuinely absent (not guessed) on hosting that provides neither.
 * Vercel and Cloudflare are the two most common fronts for a Next.js app;
 * add another header here if a different platform is used.
 *
 * Shared between `/r/[slug]/route.ts` (a fetch-API `Headers` from the raw
 * `Request`) and `/p/[slug]/page.tsx` (Next's `ReadonlyHeaders` from
 * `next/headers`'s `headers()`) — both satisfy this minimal `.get()` shape,
 * so this one function is the single place the header fallback order lives
 * rather than being duplicated per call site.
 */
export function readEdgeCountryCode(headers: { get(name: string): string | null }): string | null {
  return headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry");
}
