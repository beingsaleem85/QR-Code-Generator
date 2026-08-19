# Deployment

This app is a standard Next.js 16 (App Router) project with no framework-specific deployment requirements — it deploys to any platform that runs Next.js (Vercel, a Node server, etc.). This document covers what's actually required to run it in production; it does not prescribe a specific hosting platform.

## Required environment variables

See [`docs/SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for where each value comes from. In production:

- `NEXT_PUBLIC_SUPABASE_URL` — required.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required.
- `SUPABASE_SERVICE_ROLE_KEY` — leave blank. This project has never used it (see [`docs/SECURITY.md`](./SECURITY.md)); setting it in production doesn't enable anything this app currently uses.
- `SUPABASE_ACCESS_TOKEN` / `SUPABASE_PROJECT_REF` — not needed at runtime. Only used ad hoc, locally, for CLI operations (migration pushes, the `mailer_autoconfirm` toggle) — never set these as a deployed app's runtime environment variables.
- `NEXT_PUBLIC_APP_URL` — **must** be set to the real production origin (e.g. `https://yourdomain.com`). This drives `metadataBase`, canonical URLs, `sitemap.ts`/`robots.ts`, and every dynamic-QR redirect (`/r/[slug]`) and landing-page (`/p/[slug]`) link generated and printed on a QR code. Getting this wrong means every QR code generated before the fix encodes a link to the wrong domain — get it right before real users create real QR codes, not after.

## Domain configuration

1. Point your production domain at the deployment platform per its own instructions.
2. Set `NEXT_PUBLIC_APP_URL` to that domain (with `https://`, no trailing slash).
3. Add the domain to Supabase's Auth **redirect URL allow list** (`https://yourdomain.com/**`) — without this, `/auth/callback` (email confirmation, password reset) will be rejected by Supabase for anyone using the production domain.
4. Update Supabase's **Site URL** to the production domain (used in auth email templates).

## Storage settings

The 5 Storage buckets (`avatars`, `qr-logos`, `qr-documents`, `qr-gallery`, `qr-media`) are created and configured entirely by the migrations in `supabase/migrations/` — no manual Storage configuration is needed in production beyond running `supabase db push --linked` once, per [`docs/SUPABASE_SETUP.md`](./SUPABASE_SETUP.md). Confirm the bucket size limits (2-20MB depending on bucket) match your actual product requirements before launch; they're currently sized to this app's real, documented per-type upload limits (see `/faq` or `docs/ARCHITECTURE.md`'s Module 3.9 section), not arbitrary defaults.

## Optional: email provider

Supabase's built-in email sending (used for signup confirmation and password reset) has a low rate limit suitable for development, not production signup volume — this project hit that limit organically during its own live-verification testing (see `docs/SESSION_HANDOFF.md`). Before launching with real user signups, configure a custom SMTP provider in Supabase's Auth settings (Project Settings → Authentication → SMTP Settings) to avoid the same limit affecting real users.

## Optional: monitoring

No error-tracking or uptime-monitoring service is integrated in this codebase. `src/app/api/health` is a real, working health-check route (`GET /api/health` → 200 JSON) suitable for wiring into whatever uptime monitor your deployment platform supports. Consider adding a real error-tracking service (Sentry or similar) before a genuine production launch — this is a deliberate scope gap, not an oversight; no such service was in scope for any module of this build.

## Build and start

```bash
npm install
npm run build
npm run start
```

`npm run build` runs a real TypeScript check as part of the Next.js build (in addition to `npm run typecheck`, which can be run standalone) — a build that produces broken types will fail here, not silently ship. Every route's static/dynamic classification is fixed at build time and printed in the build output; confirm marketing/public pages remain statically prerendered (`○`) and only genuinely per-user/per-QR routes are dynamic (`ƒ`) — see the route list in `docs/ARCHITECTURE.md`'s Module 3.14 section for what "correct" looks like.

## Pre-launch checklist

- [ ] `NEXT_PUBLIC_APP_URL` set to the real production domain
- [ ] Supabase Auth redirect URL allow list includes the production domain
- [ ] Supabase Site URL set to the production domain
- [ ] Custom SMTP configured (if expecting real signup volume)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` left blank
- [ ] `mailer_autoconfirm` is `false` (confirm it wasn't left `true` from a testing session — see `docs/SUPABASE_SETUP.md`)
- [ ] A real Open Graph image added (see `docs/ARCHITECTURE.md`'s Module 3.14 "Known issues" — none exists yet)
- [ ] `/privacy` and `/terms` have had an actual legal review (both currently carry a visible "not yet legally reviewed" banner — see Module 3.15)
- [ ] A dedicated privacy/legal contact address added to `/privacy` and `/terms`
