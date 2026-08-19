import type { NextConfig } from "next";
import path from "node:path";

/**
 * Module 3.12 (Security Hardening): a pragmatic CSP, not a maximal one —
 * "CSP where practical" is the master prompt's own wording. `'unsafe-inline'`
 * on `script-src`/`style-src` is a deliberate, documented trade-off: Next.js
 * App Router injects inline hydration data and this app uses a handful of
 * inline `style={{...}}` attributes (e.g. `Avatar`'s computed size); a fully
 * nonce-based CSP would remove the need for it but is a larger, riskier
 * change to verify without a real staging environment — a real hardening
 * step for later, not skipped silently (see docs/ARCHITECTURE.md).
 *
 * `https://*.supabase.co` covers auth/PostgREST/Storage calls (the browser
 * Supabase client talks to this origin directly) without hardcoding one
 * project's own subdomain. `img-src` allows any `https:` source because
 * Module 3.9's Social QR type lets an owner paste an arbitrary external
 * avatar URL by design — restricting this would break a real, intended
 * feature, not just an XSS surface. `img-src` also allows `blob:` — found
 * live by Module 3.16's E2E suite that PNG export (`QRDownloadActions`,
 * `renderStyledQrPngDataUrl`) loads the rendered SVG into an `<img>` via a
 * `blob:` object URL before drawing it to canvas; without `blob:` here,
 * every PNG download was silently CSP-blocked in production since this
 * policy shipped in Module 3.12 (page-load checks never exercised the
 * download button, so it went unnoticed until a real click-through test).
 *
 * `'unsafe-eval'` is added to `script-src` in development only — confirmed
 * live (Module 3.12) that without it, React's dev-mode tooling logs
 * "eval() is not supported... React requires eval() in development mode
 * for various debugging features." React's own docs are explicit that
 * production builds never call `eval()`, so this never weakens the CSP
 * actually shipped to users.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https://*.supabase.co",
  "frame-src 'self' https://*.supabase.co https://www.youtube.com https://player.vimeo.com",
  "connect-src 'self' https://*.supabase.co",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
