# Security

A consolidated summary of this project's security posture. Every claim here is backed by a real migration, a real live-verification pass, or a real audit performed during this build — cross-references point at `docs/ARCHITECTURE.md`'s per-module sections for the full rationale and verification record, this document is the synthesis, not new research.

## Core architectural stance: RLS-everywhere, zero service-role key

Every table has Row Level Security enabled, and `SUPABASE_SERVICE_ROLE_KEY` has never been used anywhere in this codebase's application code — confirmed blank in `.env.local` throughout the entire build, and reconfirmed via a direct grep of every tracked file during Module 3.17's secret scan. Every operation that would normally reach for the service-role key (bypassing RLS) instead uses a narrow, purpose-built `SECURITY DEFINER` Postgres function — it runs with elevated privilege only for the one specific, reviewable query it exists for, not for arbitrary access, and every one of them explicitly sets `set search_path = public, pg_temp` (audited directly across all 8 such functions in Module 3.17 — none omit it, which matters because an unset search_path on a `SECURITY DEFINER` function is a classic Postgres privilege-escalation vector).

## Row Level Security, by table

| Table                     | Policies                                                    | Notes                                                                                                                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `profiles`                | select/insert/update/delete, owner-only (`id = auth.uid()`) |                                                                                                                                                                                                                                                                          |
| `qr_folders`              | select/insert/update/delete, owner-only                     |                                                                                                                                                                                                                                                                          |
| `qr_codes`                | select/insert/update/delete, owner-only                     | **No `anon` SELECT policy** — deliberate. Public redirect/landing-page access goes through `resolve_qr_redirect_checked`/`resolve_landing_page`, not a relaxed policy, so unauthenticated access is scoped to exactly "resolve this one slug," never "read any QR code." |
| `qr_scan_events`          | select, owner-only                                          | **No INSERT/UPDATE/DELETE policy for any role.** Writes only happen through `record_qr_scan` (`SECURITY DEFINER`), called from the redirect route — a client can never insert a fake scan event directly.                                                                |
| `qr_assets`               | select/insert/update/delete, owner-only                     | Public read for active-QR files is a separate Storage-level policy (see below), not a relaxation of this table's own RLS.                                                                                                                                                |
| `account_entitlements`    | select, owner-only                                          | **No write policy for any role at all** — a plan can only be granted/changed via a direct, deliberate privileged database operation, never from client code.                                                                                                             |
| `qr_feedback_submissions` | select, owner-only                                          | **No INSERT policy for any role.** Anonymous submission goes through `submit_qr_feedback` (`SECURITY DEFINER`), keyed by slug, silently no-ops on any invalid/inactive target.                                                                                           |
| `rate_limit_buckets`      | **zero policies for any role**                              | RLS-enabled with nothing granted — the only access path is `check_rate_limit()` (`SECURITY DEFINER`). Confirmed live: a direct anonymous `select` against this table returns `[]`.                                                                                       |

This matches the master build prompt's own §7 policy-intent examples for user-owned records, extended with the additional narrow exceptions above where a genuine cross-user or anonymous use case exists.

## Storage policies

All 5 buckets are private by default except `avatars` (public read, no sensitive content). Every bucket has owner-scoped select/insert/update/delete policies (path convention: `{user_id}/{qr_code_id_or_asset_id}/{filename}`, enforced at the database level). `qr-documents`/`qr-gallery`/`qr-media` additionally have a narrow public-read policy scoped through `qr_asset_is_publicly_readable()` (`SECURITY DEFINER`) to exactly the files belonging to a **dynamic, active** QR code — pausing or archiving a QR immediately revokes public read for its files, with no separate flag to keep in sync by hand. `qr-logos` deliberately has no public-read policy — logos are only ever composited into a rendered QR image server/client-side from the owner's own session, never served as a standalone public file.

## Redirect and landing-page security

`isSafeRedirectTarget` rejects dangerous URL schemes at both input time (every relevant Zod schema) and redirect time (`/r/[slug]`, every landing-page component that renders a stored URL as a link) — applied consistently, confirmed via direct grep across the codebase in Module 3.12's own audit. `/r/[slug]` and `/p/[slug]` are on separate route trees so redirect latency never depends on landing-page render cost.

## Rate limiting

`check_rate_limit()` (`SECURITY DEFINER` fixed-window counter, `rate_limit_buckets`) is wired into `/r/[slug]` (60 requests/60s per IP, combined with redirect resolution into one round trip since Module 3.13) and `submitQrFeedback` (5/hour per IP+slug). Fails open on any error — a broken limiter must never take down the thing it protects. Client IP is read from `x-forwarded-for`/`x-real-ip`; when neither is present, rate limiting is skipped for that request rather than bucketing every such request together (which would be a self-inflicted denial of service).

## Security headers / CSP

`next.config.ts` sets a Content-Security-Policy plus `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a conservative `Permissions-Policy` (camera/microphone/geolocation/payment/usb all denied) on every route.

The CSP is pragmatic, not maximal:

- `script-src`/`style-src` include `'unsafe-inline'` — Next.js App Router's inline hydration data and a handful of inline `style={{...}}` attributes need it; a fully nonce-based CSP would close this but is a larger, riskier change deferred for later.
- `img-src` allows `data:`, `blob:` (added Module 3.16, after a real bug — see below), and any `https:` origin (Social QR's pasted avatar URLs are a deliberate feature, not just an XSS surface to close).
- `'unsafe-eval'` on `script-src` is **development-only** (`NODE_ENV === "development"`) — React's dev-mode debugging tooling needs it; production builds never call `eval()`, verified live against both a real dev server and a real `next start` production server.

**A real bug this posture already caught and fixed**: `img-src` didn't include `blob:` from when the CSP first shipped (Module 3.12) until Module 3.16's E2E testing caught it — silently breaking every PNG download in production the entire time, because PNG export loads a rendered SVG into an `<img>` via a `blob:` object URL before drawing to canvas. This is exactly why Module 3.16's real, click-driven E2E tests exist: a CSP violation on page **load** says nothing about a CSP violation on a click-driven browser API call.

## Authentication

Real Supabase Auth throughout — `proxy.ts` does an optimistic, cookie-based check on every request (never trusts a client-supplied identity), and `getAuthenticatedUser()` (the DAL) does a mandatory, database-verified re-check on every `(dashboard)` route render — defense in depth, not redundant. Every Server Action derives `user.id` from the authenticated session (`supabase.auth.getUser()`), never from client input — confirmed by reading every action file directly, not assumed, across multiple modules' own audits.

## Secret handling

- `SUPABASE_SERVICE_ROLE_KEY` — never used, confirmed blank.
- `SUPABASE_ACCESS_TOKEN` (a Supabase CLI/Management-API personal access token, distinct from the service-role key) — used only ad hoc, locally, for migration pushes and the `mailer_autoconfirm` toggle. **Never persisted to any file** in this project at any point across its entire build — supplied as an ephemeral shell variable each time it's genuinely needed, never echoed back, never committed.
- `.env.local` is gitignored; only `.env.example` (all-blank placeholders) is tracked. Confirmed via `git ls-files`/`git check-ignore` in Module 3.17's own audit.
- A repo-wide secret scan (Module 3.17) found zero real credential values in tracked files — the two grep hits it did produce were both the literal word "service_role" used in prose/config describing the Postgres role name, not a leaked value.

## Known, accepted trade-offs (not oversights)

- `'unsafe-inline'` on the CSP's `script-src`/`style-src` — a nonce-based CSP would close this, deferred as a larger, separately-verifiable change.
- No per-user file-upload-frequency rate limit — uploads are already behind authentication and per-bucket size/MIME limits; `checkRateLimit()` is available to add one cheaply if real abuse is ever observed.
- Orphaned Storage blobs accumulate in `qr-documents` by design of a real gap, not a fixed count — every time the Playwright E2E suite's File QR journey runs against the live project, its throwaway account gets deleted (cascading its database rows) but its uploaded file does not, since Supabase blocks direct SQL deletion of `storage.objects` (`storage.protect_delete()`) and this project deliberately never uses the service-role key to force it. 8 objects were present as of the Module 3.17 pre-deployment review (1 pre-existing Module 3.8 smoke-test blob + 7 from various E2E runs) — treat that as a snapshot, not a target; it will have grown again by the time this is read if the E2E suite has run since. Harmless (isolated per-owner paths, never read by the app, unreachable by any real user), but a real, unaddressed operational gap worth fixing (a Storage-aware E2E teardown, or a periodic reconciliation job) before running this suite repeatedly or in CI against the live project.
