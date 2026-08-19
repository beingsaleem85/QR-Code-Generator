# Final Report — QRForge QR Code Generator

Produced at the close of Module 3.17 (Production Readiness and Final Audit), the final module of [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md). Every figure and claim in this report is a real, current fact about this codebase as of this module — checked directly (grep, migration read, test run), not recalled from memory or rounded up.

## 1. Product Summary

QRForge is a QR code generation platform supporting 18 real QR content types (2 more registered but not yet implemented — see §3), each generatable as a static code (content baked directly into the printed image, permanent) or, where the type supports it, a dynamic code (points at a stable link this app hosts, so the destination, hosted content, and pause/active state can all change after printing without reprinting). Every dynamic QR code tracks real scan analytics. Users get real-time design customization (colors, gradients, frames, corner styles, a logo overlay) with built-in scannability checks, a dashboard with database-driven search/filter/sort/pagination and folders, and file-based/hosted-page QR types (PDF, image galleries, audio, link-in-bio pages, restaurant menus, feedback collection) backed by Supabase Storage.

## 2. Architecture

- **Frontend**: Next.js 16 (App Router, Turbopack), TypeScript strict mode, React 19, Tailwind CSS 4. Three route-group layouts: `(marketing)` (public pages), `(auth)` (login/signup/password reset), `(dashboard)` (authenticated app, sidebar + mobile drawer).
- **Supabase**: Postgres (17 migrations, `supabase/migrations/`), Auth (real signup/login/password reset, session-cookie-based), Storage (5 buckets), Row Level Security enabled on every table — **`SUPABASE_SERVICE_ROLE_KEY` is used nowhere in this codebase**; every privileged operation instead goes through a narrow `SECURITY DEFINER` Postgres function. See [`docs/SECURITY.md`](./SECURITY.md) for the full posture.
- **QR renderer**: a from-scratch styled SVG/PNG rendering pipeline (`src/lib/qr/{matrix,styled-svg,reliability}.ts`) — no third-party QR-rendering library. Regenerates the visual from stored `design_config`/payload on every render (download, detail-page preview, redirect); never stores a rendered image.
- **Redirect architecture**: `/r/[slug]` (a Route Handler, not a page — kept lightweight on purpose) resolves a dynamic QR's current destination and records a scan in one Supabase round trip (`resolve_qr_redirect_checked`, combining resolution with rate-limit enforcement since Module 3.13), then redirects (307). `/p/[slug]` is a separate route tree serving hosted-content landing pages (files, social/menu/feedback pages), so landing-page render cost never adds latency to a plain redirect.

## 3. Completed QR Types

**Static-or-dynamic** (10): URL/Link, Text (static only), Email (static only), Phone (static only), SMS (static only), WhatsApp, Wi-Fi (static only), vCard/Contact (static only), Event (static only), Video.

**Dynamic-only, file-hosted** (3): PDF, Image Gallery, Audio.

**Dynamic-only, hosted page** (5): App Store/Play Store, Social Media, Multiple Links/Link-in-bio, Menu, Feedback.

**Not yet implemented** (2): `barcode_2d` (2D barcode formats), `location` (map-pin QR). Both are registered in `src/lib/qr/registry.ts` with a placeholder schema and no payload builder or content form — the type selector correctly omits them from the "available" state (see `/qr-types`'s own "Coming soon" section).

**18 of 20 registry entries are real.** Do not round this up.

## 4. Database

Tables (all RLS-enabled): `profiles`, `qr_folders`, `qr_codes`, `qr_scan_events`, `qr_assets`, `account_entitlements`, `qr_feedback_submissions`, `rate_limit_buckets`.

Key relationships: `qr_codes.user_id → auth.users` (cascade delete), `qr_scan_events.qr_code_id → qr_codes` (cascade delete), `qr_assets.qr_code_id → qr_codes` (`ON DELETE SET NULL`, deliberately not cascade — application code explicitly cleans up the Storage object + row on QR delete instead), `qr_feedback_submissions.qr_code_id → qr_codes` (cascade delete), `qr_folders.user_id → auth.users` (cascade delete), `qr_codes.folder_id → qr_folders` (`ON DELETE SET NULL` — deleting a folder never deletes its QR codes).

Full RLS policy table: [`docs/SECURITY.md`](./SECURITY.md#row-level-security-by-table).

## 5. Storage

5 buckets, all created and policy-configured by migration (no manual Storage configuration needed): `avatars` (public), `qr-logos`, `qr-documents`, `qr-gallery`, `qr-media` (all private, owner-scoped, with `qr-documents`/`qr-gallery`/`qr-media` additionally readable anonymously for exactly the files belonging to an active, dynamic QR code). Full bucket table and policy detail: [`docs/SECURITY.md`](./SECURITY.md#storage-policies), [`docs/SUPABASE_SETUP.md`](./SUPABASE_SETUP.md#4-what-the-migrations-create).

## 6. Analytics

**Tracked**, per scan of a dynamic QR code: timestamp, referrer, device type/OS/browser (parsed from the standard User-Agent header), and a country code — only when the hosting platform's edge provides one (`x-vercel-ip-country`/`cf-ipcountry`), never via a geo-IP lookup call.

**Intentionally not tracked**: raw IP address, precise/city-level location, any identifier that would let this app recognize the same visitor across multiple scans, and any tracking for static QR codes (static-code "scans" never touch this app's server at all — there's nothing to record).

## 7. Testing

- **Unit/component**: 474 tests across 70 files (Vitest + Testing Library), covering payload builders/validation for every implemented QR type, the styled-SVG/PNG rendering pipeline, Server Actions (RLS-aware error handling, session-derived ownership), rate limiting, redirect/landing-page resolution, and every reusable dashboard component. `npm run test`.
- **Integration**: no separate `tests/integration/` layer — judged, after reading the existing suite, that the unit-level Server Action/service tests already exercise real RLS-aware query shape and error handling (QR CRUD, ownership, dynamic destination update, scan event creation, storage metadata all covered this way), which is this project's real, established testing strategy rather than a gap.
- **E2E**: 6 named journeys (Playwright) — Anonymous Static QR, Account Creation, Dynamic QR, Analytics, Authorization, File QR — all live-verified against a real Supabase project. 12/12 passing across the 2 working browser projects in this environment (Chromium desktop + Chromium mobile-emulated; Firefox couldn't launch in this specific sandbox, see §8). `npm run test:e2e`.
- **A real production bug was found and fixed by this test suite**: the CSP's `img-src` directive didn't allow `blob:`, silently breaking every PNG download since Module 3.12 shipped the CSP. See [`docs/SECURITY.md`](./SECURITY.md#security-headers--csp).
- **Gates re-run clean for this module**: `typecheck`, `lint` (0 errors, 11 pre-existing React-Compiler informational warnings on `react-hook-form`'s `watch()`, not errors), `format:check`, `npm audit` (0 vulnerabilities), a fresh `npm run build` (all previously-static public routes remain static).

## 8. Known Limitations

Deliberately deferred or accepted, not oversights:

- **`barcode_2d`/`location` QR types** — registered but not implemented.
- **`/pricing`** — a deliberate placeholder; billing/monetization is out of scope until the core product is stable (a real business decision, not this build's to make).
- **No Open Graph image** — `openGraph`/`twitter` metadata populate correctly without one, but no image asset exists; a real design asset, not fabricated.
- **No dedicated privacy/legal contact address** — `/privacy`/`/terms` disclose this honestly rather than inventing one.
- **`/privacy`/`/terms` have not had an actual legal review** — both carry a visible on-page banner saying so; do not remove it without a real sign-off.
- **No self-service account-deletion control** in the dashboard — `/privacy` discloses this; a real dashboard feature, not a legal-copy task.
- **CSP's `'unsafe-inline'`** on `script-src`/`style-src` — a nonce-based CSP would close this, deferred as a larger, separately-verifiable change.
- **No per-user file-upload-frequency rate limit** — uploads are already behind auth + size/MIME limits; cheap to add later if real abuse is observed.
- **Firefox can't launch in this specific sandboxed dev environment** — an environment limitation, not a code defect; the `firefox-desktop` Playwright project stays correctly configured for a normal CI/local run.
- **5 small orphaned test PDF blobs** remain in the `qr-documents` Storage bucket from E2E test runs — harmless, isolated per-owner paths; matches an existing, already-accepted Module 3.8 precedent rather than escalating to the service-role key to clean up.
- **No error-tracking/monitoring service integrated** — `/api/health` is a real, working health-check route ready to wire into a platform's uptime monitor; a Sentry-style service was never in scope for any module.
- **No custom SMTP configured** — Supabase's built-in email sending has a low rate limit unsuitable for real signup volume; see [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md).

## 9. Required Production Configuration

See [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) for the full checklist. Summary:

- **Environment variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` (must be the real production domain — every printed QR code's link generation depends on it). `SUPABASE_SERVICE_ROLE_KEY` stays blank. `SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF` are local-only, never set in a deployed environment.
- **Domain**: point the production domain at the deployment platform, set `NEXT_PUBLIC_APP_URL` to match.
- **Supabase redirect URLs**: add the production domain to Auth's `uri_allow_list` and Site URL.
- **Storage settings**: no manual configuration needed — buckets and policies are created entirely by `supabase db push --linked`.
- **Optional email provider**: configure custom SMTP before real signup volume (Supabase's default limit is dev-scale).
- **Optional monitoring**: no service integrated; `/api/health` is ready to wire into one.

## 10. Future Enhancements

Only genuinely deferred items — not a wishlist invented for this report:

- Real pricing/monetization content for `/pricing`, once that's a made business decision.
- `barcode_2d` and `location` QR types.
- A nonce-based CSP (removing `'unsafe-inline'`).
- A real Open Graph image and social-share preview.
- A self-service account-deletion flow in the dashboard.
- A dedicated privacy/legal contact channel, followed by an actual legal review of `/privacy`/`/terms`.
- Custom SMTP + a real error-tracking/monitoring integration before a genuine production launch with real users.
- A per-user file-upload-frequency rate limit, if real abuse is ever observed.
