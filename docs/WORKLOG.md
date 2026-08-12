# Worklog

## Module 1.1 — Repository and Application Foundation

Status: COMPLETE

Completed:

- Scaffolded Next.js 16.3.0 app (App Router, `src/` layout) with TypeScript strict mode, Tailwind CSS 4, ESLint flat config.
- Added Prettier + `eslint-config-prettier` and wired it into the ESLint flat config; added `format`/`format:check`/`typecheck` npm scripts.
- Confirmed `tsconfig.json` strict mode and `@/*` → `./src/*` path alias (set up by the scaffold).
- Established the full suggested directory architecture under `src/` (`components/*`, `features/*`, `lib/*`, `server/*`, `types/`, `config/`) plus `supabase/migrations/`, `supabase/seed.sql`, and `tests/{unit,integration,e2e}/`. Empty dirs tracked via `.gitkeep`.
- Added `.env.example` documenting the expected Supabase variables (no real values); confirmed `.gitignore` excludes `.env*` while explicitly allowing `.env.example`.
- Added application-level error handling conventions: `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`, `src/app/loading.tsx`.
- Added a build/health verification route at `src/app/api/health`.
- Replaced the `create-next-app` starter homepage/layout copy and removed unused starter SVG assets (`public/*.svg`) — no feature UI implemented yet, just a neutral placeholder.
- Created `README.md`, `docs/ARCHITECTURE.md`, `docs/WORKLOG.md` (this file), `docs/SESSION_HANDOFF.md`.
- Reviewed the bundled Next.js 16 upgrade/breaking-changes doc (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`) since v16 postdates training knowledge; noted async-only request APIs, `middleware.ts` → `proxy.ts` rename, and removal of `next lint` in `docs/ARCHITECTURE.md`.

Verification:

- `npm run typecheck` — pass, no errors
- `npm run lint` — pass, no errors/warnings
- `npm run format:check` — pass (one round of `npm run format` applied first)
- `npm run build` — pass; production build clean with no warnings (fixed a Turbopack workspace-root warning by setting `turbopack.root` in `next.config.ts`, caused by an unrelated stray `package-lock.json` in the parent `D:\AntiGravity` directory)
- `npm run dev` — started successfully; Next.js auto-selected port 3001 because port 3000 was already in use by an unrelated project (`D:\AntiGravity\LMS`) — that project's server was left untouched
- Route smoke test on the dev server: `GET /` → 200, `GET /api/health` → 200 JSON, `GET /does-not-exist` → 404 (via `not-found.tsx`)
- Dev server process stopped cleanly after verification; confirmed port 3001 released and the unrelated port-3000 process still running
- No real credentials present in the repository; `.env.example` contains only empty placeholders and is explicitly un-ignored; `git status` shows no secret files staged or untracked

Known issues:

- Repository has no remote configured (local git only, initialized by the `create-next-app` scaffold with one prior commit: "Initial commit from Create Next App"). All Module 1.1 changes are currently uncommitted in the working tree, pending explicit instruction to commit.
- No automated tests exist yet — none are required until QR payload builders land in Module 1.3.

Next:

- Module 1.2 — Route and Information Architecture

## Module 1.2 — Route and Information Architecture

Status: COMPLETE

Completed:

- Created the public route skeleton under a `(marketing)` route group: `/`, `/qr-generator`, `/qr-types`, `/static-qr`, `/dynamic-qr`, `/features`, `/pricing`, `/faq`. Moved the existing homepage into `(marketing)/page.tsx`.
- Created the `(auth)` route group: `/login`, `/signup`, `/forgot-password`.
- Created the `(dashboard)` route group: `/dashboard`, `/dashboard/qr-codes`, `/dashboard/qr-codes/new`, `/dashboard/qr-codes/[id]`, `/dashboard/qr-codes/[id]/edit`, `/dashboard/qr-codes/[id]/analytics`, `/dashboard/files`, `/dashboard/account`, `/dashboard/settings`.
- Created `src/app/r/[slug]/route.ts` — a Route Handler (not a page) that resolves a slug via a typed `resolveDynamicQrRedirect` contract (`src/server/services/redirect-resolution.ts`) and either redirects or returns a 404 JSON stub. The contract is fully typed now; Module 3.6 fills in the real Supabase lookup without changing the route shape.
- Created `src/app/p/[slug]/page.tsx` for hosted landing pages (real page, not a redirect — kept on a separate route tree from `/r/[slug]` so dynamic-QR redirect latency never depends on landing-page render cost).
- Added a shared `RouteStub` component (`src/components/layout/RouteStub.tsx`) so all 20 placeholder pages stay trivial and consistent, and are easy to replace one-by-one in Phase 2.
- Documented the full route map and the protected-route strategy (a future `proxy.ts`, not `middleware.ts` — renamed in Next 16 — plus mandatory server-side re-checks) in `docs/ARCHITECTURE.md` under "Route Architecture".
- Regenerated stale Next.js route types (`npx next typegen`) after moving `page.tsx` into the `(marketing)` group.

Verification:

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run format:check` — pass
- `npm run build` — pass; all 21 routes compiled (17 static, 4 dynamic: `/api/health`, the three `[id]`/`[slug]` routes, and `/r/[slug]`)
- Dev server smoke test: all 20 page routes return 200; `/r/[slug]` returns 404 with `{"error":"not_found"}` (correct — no real dynamic-QR data source exists yet, and the route must never claim an unresolved slug is valid)
- Dev server stopped cleanly after verification

Known issues:

- `(dashboard)` routes are not yet access-controlled (no auth exists until Module 1.5/3.1) — this is expected per the module scope, not a defect.
- All changes for this module are staged for commit alongside this worklog entry.

Next:

- Module 1.3 — QR Domain Model and Type System

## Module 1.3 — QR Domain Model and Type System

Status: COMPLETE

Completed:

- Defined `QRMode` and the 20-member `QRType` union, plus the `QRTypeDefinition` registry-entry interface, in `src/types/qr.ts`.
- Built the QR type registry (`src/lib/qr/registry.ts`, `qrTypeRegistry`) — one config entry per `QRType`, config-driven rather than scattered conditionals. All 20 types are registered; the 9 types named explicitly in the master prompt (§1.3) have a real field schema and payload builder wired in, the rest carry a placeholder schema and no builder until their storage/landing-page module (3.8/3.9) lands.
- Wrote 9 pure, typed payload builder functions under `src/lib/qr/payload-builders/`: URL, text, `mailto:` (email), `tel:` (phone), `sms:`, WhatsApp (`wa.me`), Wi-Fi (`WIFI:...`), vCard 3.0, and iCalendar `VEVENT`/`VCALENDAR` (event). Shared WIFI/vCard/iCal escaping lives in `payload-builders/shared/escaping.ts`. No QR canvas/SVG code exists in this layer — payload building and rendering stay separate per the master prompt.
- Added a Zod schema per implemented type under `src/lib/validation/qr/`, each exporting both the schema and its inferred TS input type. Notable validation: URL normalizes scheme-less input to `https://` and rejects non-http(s) schemes; Wi-Fi requires a password unless encryption is `nopass`; vCard requires a first or last name; event rejects an end before the start.
- Installed Zod (validation) and Vitest (test runner); added `npm run test` / `test:watch` scripts and `vitest.config.mts` (path alias resolution matching `tsconfig.json`'s `@/*`).
- Wrote 41 unit tests across 10 files under `tests/unit/qr/` — every implemented builder has valid/invalid/Unicode-preservation cases, plus a `registry.test.ts` checking the registry's structural invariants (20 entries, self-consistent keys, `payloadBuilder` present iff the type is one of the 9 implemented ones).
- Documented the domain model in `docs/ARCHITECTURE.md` under "QR Domain Model".

Verification:

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run format:check` — pass
- `npm run test` — pass, 41/41 tests across 10 files
- `npm run build` — pass; all 21 routes still compile (unchanged from Module 1.2, since this module added no pages)

Known issues:

- 11 of the 20 `QRType` registry entries (`pdf`, `app`, `images`, `video`, `social`, `barcode_2d`, `multi_link`, `menu`, `feedback`, `audio`, `location`) intentionally have no field schema or payload builder yet — expected, not a defect; each is scoped to a later module.
- No UI wiring yet — the registry and builders are not imported from any page. That's Module 2.4+ (generator UI) and Module 3.2 (real static QR generation).

Next:

- Module 1.4 — Supabase Database Architecture

## Module 1.4 — Supabase Database Architecture

Status: COMPLETE

Completed:

- Wrote 6 deterministic SQL migrations under `supabase/migrations/`: extensions/shared trigger function, `profiles`, `qr_folders`, `qr_codes`, `qr_scan_events`, `qr_assets`.
- `qr_codes` centralizes static and dynamic codes: `mode`/`qr_type`/`status` check constraints (the `qr_type` value list is kept in sync with `src/types/qr.ts`'s `QRType` union), a partial unique index on `slug` (null allowed for static codes), and a check constraint requiring a slug whenever `mode = 'dynamic'`.
- `qr_scan_events` intentionally has no raw-IP or raw-User-Agent column — stricter than the master prompt's "nullable or privacy-minimized" suggestion — only derived fields (`country_code`, `device_type`, `os`, `browser`, etc.) and an optional `ip_hash`.
- Chose delete behavior deliberately per relationship: `auth.users → {profiles, qr_folders, qr_codes, qr_assets}` = cascade; `qr_codes → qr_scan_events` = cascade; `qr_folders → qr_codes.folder_id` = set null; `qr_codes → qr_assets.qr_code_id` = set null.
- Enabled RLS (default-deny, zero policies) on every table now, ahead of writing the actual policies in Module 1.5.
- Documented the full schema, indexes, and delete-behavior rationale in `docs/ARCHITECTURE.md` under "Database Schema".

Verification — validated against a real local Postgres instance, not just read by eye:

- Ran a local Supabase stack via `supabase init` + `supabase start` on Docker (fully local/offline — no hosted project, no credentials). First attempt failed on a transient DNS resolution error pulling `storage-api` from `public.ecr.aws` (`no such host`); confirmed DNS actually resolved fine moments later and retried — the retry succeeded using cached layers for the already-pulled images.
- `\dt public.*` confirmed all 5 tables exist; `\d` on each confirmed every column, check constraint, foreign key, index, and trigger matches the migration source exactly.
- Functional tests via `docker exec ... psql`: inserted a static QR (no slug) and a dynamic QR (with slug) successfully; confirmed rejections for (a) a dynamic QR with no slug, (b) an invalid `qr_type`, (c) a duplicate slug; confirmed the `updated_at` trigger bumps on `UPDATE`.
- Delete-cascade tests: deleting a `qr_folders` row set the referencing `qr_codes.folder_id` to null (code survived); deleting a `qr_codes` row cascade-deleted its `qr_scan_events` and set the referencing `qr_assets.qr_code_id` to null; deleting the owning `auth.users` row cascade-deleted its `profiles`/`qr_codes`/`qr_assets` rows.
- Ran `supabase db reset` (drops and recreates from migrations + `seed.sql` only) to confirm the migrations are deterministic end-to-end; all 6 applied cleanly in order, all 5 tables recreated empty.
- Stopped the local stack (`supabase stop`) afterward — data persisted in a Docker volume, not required to keep running between sessions.

Known issues:

- The `supabase_vector_QR` (analytics/log shipping) container repeatedly restarted during startup — a known Supabase-CLI-on-Windows limitation ("Analytics on Windows requires Docker daemon exposed on tcp://localhost:2375"), unrelated to the schema and with no effect on the database or migrations.
- `supabase init` added `supabase/config.toml` and `supabase/.gitignore` (the latter already correctly excludes `.branches`/`.temp`); these are local-dev-only config, not secrets.
- No RLS policies yet — intentionally deferred to Module 1.5.

Next:

- Module 1.5 — Supabase Auth, Storage, and RLS Design

## Module 1.5 — Supabase Auth, Storage, and RLS Design

Status: COMPLETE

Completed:

- Wrote owner-only RLS policies for `profiles`, `qr_folders`, `qr_codes`, and `qr_assets` (`auth.uid() = user_id`/`= id` for select/insert/update/delete) in a new migration.
- Deliberately did **not** give `qr_codes` an `anon` SELECT policy and did **not** give `qr_scan_events` any INSERT/UPDATE/DELETE policy for any client role — both are documented design decisions (public redirect resolution and scan-event writes must go through a privileged server-side path in Module 3.6/3.7, never a client-facing RLS grant) rather than oversights.
- Designed 5 Storage buckets (`avatars` public, `qr-logos`/`qr-documents`/`qr-gallery`/`qr-media` private) with per-bucket `allowed_mime_types` and `file_size_limit`, plus a `{user_id}/...` path convention enforced by `storage.objects` RLS policies via `(storage.foldername(name))[1] = auth.uid()::text`.
- Documented server vs. client Supabase responsibilities (browser client, server client, `server/repositories`, `server/actions`, service-role key scope) in `docs/ARCHITECTURE.md`.

Verification — validated against the same local Docker-only Supabase stack used in Module 1.4 (still no live/hosted project or credentials):

- `supabase db reset` applied all 8 migrations (the original 6 plus this module's 2) cleanly and in order.
- Confirmed via `pg_policies` that exactly the intended policies exist: 17 on the 5 tables (4 each on `profiles`/`qr_folders`/`qr_codes`/`qr_assets`, 1 on `qr_scan_events`) and 20 on `storage.objects` (4 per private bucket × 4 buckets, plus 4 for `avatars`); confirmed the 5 buckets have the correct `public`/size/MIME-type config.
- **Cross-user access test:** seeded two users (Alice, Bob) each with their own `qr_codes` row and a `qr_scan_events` row. As Alice (`set role authenticated; set request.jwt.claim.sub = '<alice-id>'`): she saw only her own `qr_codes`/`profiles`/`qr_scan_events` row (not Bob's); an `UPDATE` targeting Bob's QR code affected 0 rows; an `INSERT` attempting to spoof `user_id = bob` was rejected by the RLS `WITH CHECK` clause.
- **Anon-role test:** `set role anon` returned 0 rows from every one of the 5 tables, and a direct `INSERT` into `qr_scan_events` (simulating an attacker hitting the table directly rather than through the intended server path) was rejected — confirming the "no client-facing insert" design actually holds at the database level, not just in a code comment.
- **Storage policy test:** as Alice, an insert into `storage.objects` under her own `{user_id}/...` folder in a private bucket succeeded; the same insert under Bob's folder was rejected; `anon` saw 0 rows querying a private bucket's objects but _did_ see a row in the public `avatars` bucket once one existed — confirming the public/private split works as designed.
- Reset to a clean state and ran `supabase stop` afterward.
- App-level checks unaffected by this module (no application code changed): `typecheck`, `lint`, `format:check`, `test` (41/41), and `build` all still pass.

Known issues:

- No RLS test exists yet for the `service_role` bypass path itself (trivially true by Postgres/Supabase design — service role bypasses RLS entirely — but not exercised here since no server code calls Supabase yet).
- Auth is still not wired into the app (Module 3.1). These policies are correct and tested at the database level but have no application code depending on them yet.

Next:

- Module 1.6 — Structural Component Architecture

## Module 1.6 — Structural Component Architecture

Status: COMPLETE

Completed:

- Built all 21 named component skeletons from the master prompt's list: 8 QR generator components (`QRGeneratorShell`, `QRTypeSelector`, `QRContentPanel`, `QRDesignPanel`, `QRPreviewPanel`, `QRDownloadActions`, `QRNameField`, `QRModeToggle`) + 5 design-control components (`design-controls.tsx`) under `src/components/qr/`; 6 dashboard components (`DashboardSidebar`, `DashboardHeader`, `QRCodeCard`, `QRCodeTable`, `QRCodeStatusBadge`, `EmptyState`) under `src/components/dashboard/`; 3 analytics components (`AnalyticsSummaryCards`, `AnalyticsChartShell`, `AnalyticsFilters`) under `src/components/analytics/`.
- Added a shared `Placeholder` UI primitive (`src/components/ui/Placeholder.tsx`) so the ~20 structural skeletons don't duplicate the same filler markup.
- Added `src/types/qr-design.ts` (`DesignConfig` + `DEFAULT_DESIGN_CONFIG`) and `src/types/qr-record.ts` (`QRCodeSummary`, `QRCodeStatus`) — the shapes the new components' props reference.
- `QRTypeSelector` and `QRContentPanel` read directly from the Module 1.3 registry (`listQrTypeDefinitions`/`getQrTypeDefinition`), filtered by `staticSupport`/`dynamicSupport` — no hardcoded type list anywhere in the component tree.
- `QRGeneratorShell` owns all generator state locally (`mode`, `qrType`, `name`, `content`, `design`) and composes the other 7 generator components from it — no global store, satisfying the Module 1.1 state-ownership rule.
- Replaced the `/qr-generator` page's `RouteStub` with the real `QRGeneratorShell` composition, directly satisfying the "generator shell renders structurally" acceptance criterion.
- Documented component responsibilities, form architecture, and the state-ownership rule (as applied to the actual component list) in `docs/ARCHITECTURE.md` under "Component Architecture".

Verification:

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run format:check` — pass
- `npm run test` — pass, 41/41 (unaffected by this module)
- `npm run build` — pass; all 21 routes still compile, `/qr-generator` now renders the real shell
- **Live browser verification** (dev server + Browser pane, not just a build check): loaded `/qr-generator`, confirmed 13 QR types shown in Static mode and exactly 12 in Dynamic mode (matching `staticSupport`/`dynamicSupport` counts in the registry), confirmed clicking a type updates `QRContentPanel`'s label (e.g. selecting "PDF" changed the panel to "PDF content"), confirmed the name field captures typed input, and confirmed zero browser console errors throughout.
- Dev server stopped cleanly after verification.

Known issues:

- None blocking. Components are intentionally unstyled skeletons (Phase 2 replaces the visuals) and intentionally non-functional beyond local state (Phase 3 wires real behavior).
- Dashboard/analytics components were built and typecheck/lint clean but are not yet wired into their pages (only the generator shell composition was required by this module's acceptance criteria) — wiring happens alongside their respective UI modules (2.6, 2.8).

Next:

- Module 1.7 — Structure Phase Verification

## Module 1.7 — Structure Phase Verification

Status: COMPLETE — **PHASE 1 (STRUCTURE) GATE PASSED**

Verification performed fresh (not reusing prior module runs):

- `rm -rf node_modules && npm ci` — clean reproducible install from the committed lockfile, 0 vulnerabilities
- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run format:check` — pass
- `npm run test` — pass, 41/41 across 10 files
- `rm -rf .next && npm run build` — clean production build, all 21 routes compiled (17 static, 4 dynamic), no warnings
- `npm run start` (production server, not `dev`) + full route smoke test: all 21 routes → 200; `/r/[slug]` → 404 with `{"error":"not_found"}` (correct — no real dynamic-QR data source yet); an unmatched route → 404 via `not-found.tsx`. Server stopped cleanly afterward.
- `supabase start` + `supabase db reset` against the local Docker-only stack (same one used in Modules 1.4/1.5) — all 8 migrations applied cleanly in order; final tally confirmed 5 tables, 37 RLS policies (17 table + 20 storage), 5 Storage buckets, matching the counts validated in Modules 1.4/1.5 exactly. Stack stopped afterward.
- `git status` after the full cycle showed zero unexpected changes — confirms `package-lock.json` and build output are deterministic, not just "worked once."

### Structure Phase Completion Report

**1. Architecture summary.** Next.js 16.3.0 (App Router, Turbopack, `src/` layout), TypeScript strict mode, Tailwind CSS 4, ESLint flat config + Prettier, Vitest for unit tests. Directory architecture matches the master prompt's suggested layout (`app/`, `components/{ui,layout,marketing,qr,dashboard,analytics}/`, `features/*` — reserved, not yet used, `lib/{qr,validation,utils}/`, `server/{actions,repositories,services}/`, `types/`, `config/` — reserved, `supabase/migrations/`). No feature logic implemented ahead of scope; Supabase is not connected to the app yet (schema/RLS exist as migrations, validated locally, but no `src/lib/supabase` client exists — that's Module 3.1).

**2. Route map.** 21 routes across 3 route groups + 2 top-level dynamic segments:
`(marketing)`: `/`, `/qr-generator` (real `QRGeneratorShell`, not a stub), `/qr-types`, `/static-qr`, `/dynamic-qr`, `/features`, `/pricing`, `/faq`.
`(auth)`: `/login`, `/signup`, `/forgot-password`.
`(dashboard)`: `/dashboard`, `/dashboard/qr-codes`, `/dashboard/qr-codes/new`, `/dashboard/qr-codes/[id]`, `/dashboard/qr-codes/[id]/edit`, `/dashboard/qr-codes/[id]/analytics`, `/dashboard/files`, `/dashboard/account`, `/dashboard/settings`.
Top-level: `/r/[slug]` (Route Handler, redirect contract only), `/p/[slug]` (hosted landing page skeleton), `/api/health`.
Full detail in `docs/ARCHITECTURE.md` → "Route Architecture".

**3. Data model summary.** 5 tables (`profiles`, `qr_folders`, `qr_codes`, `qr_scan_events`, `qr_assets`) as deterministic SQL migrations, with FKs, indexes, check constraints (`qr_codes.qr_type` mirrors the `QRType` union in `src/types/qr.ts`), and deliberate per-relationship delete behavior (cascade vs. set-null, documented per-table). `qr_codes` centralizes static/dynamic; slug is a partial-unique index (required for dynamic, optional for static). Full detail in `docs/ARCHITECTURE.md` → "Database Schema".

**4. Security model summary.** RLS enabled (default-deny) on every table from the moment each was created; owner-only CRUD policies added in Module 1.5 (`auth.uid() = user_id`/`= id`). Two deliberate gaps, not oversights: `qr_codes` has no `anon` SELECT policy and `qr_scan_events` has no client-facing INSERT policy at all — both routed through a privileged server-side path (service-role key or `SECURITY DEFINER` RPC) in Module 3.6/3.7 instead, per master prompt §7. 5 Storage buckets (1 public — `avatars`, 4 private) with MIME/size limits and a `{user_id}/...` path convention enforced by `storage.objects` RLS. Cross-user access denial and anon lockout were functionally tested (not just written), see Module 1.5's worklog entry. No `(dashboard)` route protection exists yet — expected, since there's no auth to enforce (Module 3.1).

**5. Known blockers.** None. Every module in Phase 1 was completable without external input.

**6. Credential requirements for Phase 2/3.** **None needed yet.** Phase 2 (UI) uses mock/local data per its own charter — no Supabase connection required. The first point any live/hosted Supabase credential becomes necessary is Module 3.1 (Supabase Connection and Authentication), and even then only the minimum value for what's being wired up first (see `QR_Code_Generator_Master_Build_Prompt.md` §15, "Credential Request Protocol") — not "send me all keys."

### PHASE GATE: PASSED

Phase 1 (Structure) is complete and verified. Proceeding to **Phase 2 — UI**, starting with Module 2.1 (Visual Design System).

## Module 2.1 — Visual Design System

Status: COMPLETE

Completed:

- Established an original visual identity (deliberately not a QR.io clone): deep teal primary (`#0F766E`), light neutral surfaces, moderate radii, subtle shadows — modern SaaS, spacious, trustworthy, per master prompt §2.1.
- Defined semantic design tokens in `src/app/globals.css` using Tailwind 4's CSS-first `@theme inline` configuration: `background`/`surface`/`foreground`/`muted-foreground`/`border`, `primary`(+hover/foreground), `destructive`(+foreground), `success`, `warning`, `focus-ring`, plus radius/shadow/control-height/transition tokens.
- Discovered (by inspecting compiled CSS, not assuming) that this project's `--radius-sm/md/lg` tokens override Tailwind v4's own built-in radius scale of the same names — meaning every `rounded-*` utility in the app automatically picks up the project's moderate-radius values project-wide, documented in `docs/ARCHITECTURE.md`.
- Ran actual WCAG contrast math (not eyeballed) on every token pairing used for text; caught and fixed a focus-ring color that measured 2.49:1 (below the 3:1 non-text-contrast minimum) by reusing the primary color (5.47:1) instead.
- Added global `*:focus-visible` and `prefers-reduced-motion: reduce` rules.
- Added `Button` (4 variants × 3 sizes) and `Card` primitives under `src/components/ui/`.
- Migrated `Placeholder` (used internally by ~15 Module 1.6 skeleton components) and `QRDownloadActions` to the new tokens/primitives as proof points, without doing a full visual pass across every page yet (that's Modules 2.2–2.9, page by page).
- Documented the full token system, the v4 override discovery, and the accessibility reasoning in `docs/ARCHITECTURE.md` under "Design System".

Verification:

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run test` — pass, 41/41 (unaffected by this module)
- `rm -rf .next && npm run build` — clean production build
- Inspected the compiled production CSS directly and confirmed `bg-primary`, `text-primary-foreground`, `hover:bg-primary-hover`, `border-border`, the `:focus-visible` rule, and the `prefers-reduced-motion` rule all generated correctly with the intended values — not just assumed from source.
- Live browser verification against the **production** server: the "Save QR" button computes to `rgb(15, 118, 110)` (`#0F766E`) background with white text; `Placeholder`'s border resolves to the `border` token color (`rgb(229, 231, 235)`) in dashed style. Server stopped cleanly afterward.

Known issues:

- None blocking. Full visual/responsive pass across every page is intentionally deferred to Modules 2.2–2.10, per this module's own scope ("a few existing structural components as proof," not a full pass).
- Dark mode intentionally out of scope — not required by the master prompt's visual direction for this module.

Next:

- Module 2.2 — Public Header, Footer, and Marketing Shell

## Module 2.2 — Public Header, Footer, and Marketing Shell

Status: COMPLETE

Completed:

- Refactored `Button` to export a `buttonVariants()` helper so `next/link` CTAs can share the exact same styling as real `<button>`s without duplicating the variant/size tables.
- Added an original SVG logomark + "QRForge" wordmark (`Logo.tsx`) — a placeholder brand name, not a QR.io copy; the mark is an original abstract corner-square motif.
- Built `Header.tsx`: desktop horizontal nav (Generator, Static QR, Dynamic QR, Features, Pricing, Log in) plus a primary "Create QR Code" CTA, using the Module 2.1 tokens/`Button` primitive.
- Built `MobileNavDrawer.tsx` using the native `<dialog>` element in modal mode — gets focus trapping and Escape-to-close from the browser for free rather than reimplementing them; owns open/close state (synced via the dialog's `close` event), backdrop-click dismissal, and closes on nav-link click.
- Built `Footer.tsx`: 4 link groups (Product, QR Types, Resources, Company) + copyright.
- Added `/privacy` and `/terms` as minimal `RouteStub` routes (Module 3.15 still owns the real legal copy) so the footer has no dead links.
- Added `src/app/(marketing)/layout.tsx` wiring `Header`+`Footer` around every marketing page — `(auth)`/`(dashboard)` intentionally excluded, they get their own layouts in Modules 2.5/2.6.

Verification:

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run format:check` — pass
- `npm run test` — pass, 41/41 (unaffected)
- `rm -rf .next && npm run build` — pass; 23 routes now (added `/privacy`, `/terms`). One transient Google Fonts fetch failure on the first attempt (network blip during `next/font/google` resolution) — retried immediately and succeeded, confirming it wasn't a code issue.
- Inspected compiled production CSS directly for the trickier Tailwind v4 variants used here (`open:flex`/`open:flex-col` for the dialog's `[open]` state, `backdrop:bg-foreground/40` for `::backdrop`) and confirmed both compiled with the correct selectors/values before trusting them in the browser.
- **Live browser verification** against the production server, at both 1280px and 375px viewports:
  - Desktop nav and the mobile hamburger trigger confirmed mutually exclusive by computed `display` at each width (not just visually).
  - Drawer: opens and moves focus inside automatically (native `showModal()` behavior); confirmed both the explicit close button and a synthesized backdrop click correctly close it and sync `open` state back to `false`; confirmed clicking a nav link both navigates (`window.location.pathname` changed to `/qr-generator`) and closes the drawer in one interaction.
  - No horizontal overflow at 375px on both `/` and `/qr-generator` (`document.documentElement.scrollWidth` === `window.innerWidth`).
  - Zero console errors throughout.
  - Caught a real gap during verification, not left for the Module 2.10 audit: the drawer trigger/close buttons were 40px, under the ~44px touch-target guideline — bumped to 44px (`h-11 w-11`) and the nav-link row padding increased to match, then re-verified typecheck/lint/build.
  - Noted (not a bug): the automation `computer` tool's click/key simulation didn't reliably reach the page in this headless session ("Browser pane is not displayed" / frame-compositing unavailable) — switched to `javascript_tool` (executes directly against the DOM) for all interaction testing after confirming the first `computer` click silently failed to register.

Known issues:

- None blocking. `/privacy`/`/terms` remain intentional stubs pending Module 3.15's real legal content — this is the module's designed scope, not a defect.

Next:

- Module 2.3 — Home Page UI

## Module 2.3 — Home Page UI

Status: COMPLETE

Completed:

- Built the real homepage: 11 section components under `src/components/marketing/` (`Hero`, `GeneratorTeaser`, `TrustStrip`, `StaticVsDynamic`, `FeatureCards`, `QrTypeGrid`, `HowItWorks`, `UseCases`, `AnalyticsPreview`, `FaqTeaser`, `CtaBanner`) plus a shared `SectionHeading` helper, composed in `(marketing)/page.tsx` with zero page-level logic.
- All copy is original — not the master prompt's example hero text.
- `QrTypeGrid` reads `listQrTypeDefinitions()` straight from the Module 1.3 registry rather than hand-listing types; `AnalyticsPreview` reuses the Module 1.6 `AnalyticsChartShell` instead of building a second placeholder.
- Updated the root `<title>` to include the "QRForge" brand introduced in Module 2.2, for consistency.

Verification:

- `npm run typecheck` / `lint` / `format:check` / `test` (41/41) — all pass
- `rm -rf .next && npm run build` — pass, 23 routes unchanged in count (homepage content grew, route count didn't)
- Confirmed via compiled CSS that the Tailwind v4 opacity-modifier utility used on the CTA banner (`text-primary-foreground/85`) generates a correct `color-mix()` rule
- **Live browser verification**, with an important caveat discovered this module: this session's Browser pane does not composite frames, so `getBoundingClientRect`/`offsetTop`/`scrollHeight` all return degenerate/zero values (confirmed: a footer's `offsetTop` reported `0`). Screenshots fail outright for the same reason. This means pixel geometry could not be measured — adapted to methods that don't require a layout pass:
  - DOM content (`textContent` on `main`/`footer`) confirmed every section renders with the intended copy, in order, end to end.
  - Confirmed 22 links to `/qr-types` (20 registry-driven grid chips + hero secondary CTA + footer link) — proves the type grid is genuinely reading all 20 `QRType` entries, not a hardcoded subset.
  - Confirmed responsive behavior via **breakpoint matching** (reliable without layout, since a media query either matches or doesn't) rather than pixel measurement: hero padding 64px→80px, `h1` font-size 36px→48px, CTA button row `column`→`row`, all switching correctly between 375px and 1280px.
  - Confirmed the hero CTA link actually navigates (`window.location.pathname` → `/qr-generator`) after a `.click()`.
  - Zero console errors throughout.
  - **Retroactive note on Module 2.2**: its "no horizontal overflow, verified via scrollWidth/innerWidth" claim is now understood to be weaker evidence than stated — with layout not running in this session, that check would report "no overflow" regardless of whether a real bug existed. Not a false claim about the feature (the reviewed CSS has no obvious overflow risk), but an overstatement of what the check itself proved. Documented in `docs/ARCHITECTURE.md` under "Home Page" so it isn't silently repeated.

Known issues:

- Pixel-level visual verification (exact spacing, hero height in px, true overflow detection) was not possible in this session due to the Browser pane compositing limitation above. Everything that _could_ be verified without a layout pass was verified; a session where the pane does composite (or a manual check) would be needed to close this gap completely.

Next:

- Module 2.4 — QR Generator UI

## Module 2.4 — QR Generator UI

Status: COMPLETE

Completed:

- Installed `lucide-react` (v1.31.0) and built `qr-type-icons.tsx` mapping the registry's `icon` string keys to real icon components; `QRTypeSelector` now shows icon + label + tooltip per option.
- Installed `react-hook-form` + `@hookform/resolvers/zod` and built 9 real content forms (one per implemented `QRType`) under `src/components/qr/content-forms/`, using the existing Module 1.3 Zod schemas for genuine inline validation. `sms`/`whatsapp` share a `PhoneMessageFields` component (identical schema shape). `CONTENT_FORMS` maps type → form; the other 11 types fall back to an explanatory placeholder.
- Added `Input`/`Textarea`/`Select`/`FormField` primitives under `src/components/ui/` to support the forms.
- Replaced the 5 `Design*Controls` placeholders with real inputs (color pickers, selects, range slider, checkboxes) inside a new `AccordionItem` primitive built on native `<details>`/`<summary>`.
- Polished `QRPreviewPanel` (empty vs. filled state) and `QRGeneratorShell` (working Reset button; mode-switch now falls back to a supported type instead of leaving a stale unsupported selection).

Verification:

- `npm run typecheck` / `lint` (0 errors, 8 informational React-Compiler-compatibility warnings on the RHF `watch()` pattern — expected, non-blocking, confirmed exit code 0) / `format:check` — all pass
- `rm -rf .next && npm run build` — pass, 23 routes unchanged
- **Manual browser verification hit a real obstacle this module**: clicking type-selector/mode-toggle buttons in this session's Browser pane produced no visible state change, with zero console errors. Extensive live debugging (documented in full in `docs/ARCHITECTURE.md` under "QR Generator UI") — checking React fiber attachment via `Object.getOwnPropertyNames`/`getOwnPropertySymbols`, native event bubbling, script/chunk load status, duplicate-React checks, dev vs. prod, multiple fresh tabs — found no code-level cause and pointed to a session-level Browser-pane issue (compounding the already-documented compositing limitation from Module 2.3), not an app bug.
- **Resolved definitively rather than left ambiguous**: added `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom` as dev dependencies (fixed `vitest.config.mts`'s `include` pattern, which only matched `.test.ts` and was silently excluding the new `.test.tsx` file — caught because the total test count didn't increase after adding the file, not assumed correct). Wrote `tests/unit/components/QRGeneratorShell.test.tsx` — 5 tests exercising type selection, mode-based filtering, Reset, and blur-validation through React's real event system in `jsdom`, independent of the Browser pane. **All 5 pass** (46/46 total suite), conclusively proving the component logic is correct.
- Test suite: 46/46 passing (41 payload-builder/registry tests + 5 new component interaction tests).

Known issues:

- The Browser pane's interaction-testing reliability in this session remains unresolved/unexplained at the tooling level — documented as a standing caution for future modules, with component tests established as the reliable fallback. Content/structure checks via `textContent`/`getComputedStyle` (not full interaction) remain trustworthy per Module 2.3.
- Save/Download buttons remain intentionally disabled (Module 3.4/3.5); logo upload is a disabled file input (Module 3.8); no real QR rendering yet (Module 3.3) — all expected, not defects.

Next:

- Module 2.5 — Authentication UI

## Module 2.5 — Authentication UI

Status: COMPLETE

Completed:

- Added Zod schemas for login, signup, forgot-password, and reset-password under `src/lib/validation/auth/`.
- Added `PasswordInput` (visibility toggle) and `Alert` (error/success) UI primitives.
- Built `AuthCard` (shared centered-card wrapper) and `src/app/(auth)/layout.tsx` (logo + centered content — this route group had no layout at all before).
- Built `LoginForm`, `SignupForm`, `ForgotPasswordForm`, `ResetPasswordForm` — real React Hook Form + Zod validation, a genuine loading state (stand-in delay), and an honest "not connected to a backend yet" note on completion rather than a fake success/failure. A form-level `Alert` error slot exists in each, wired but dormant (nothing has failed yet since there's no backend).
- Wired these into the existing `/login`, `/signup`, `/forgot-password` routes, and added two new routes the master prompt's Module 2.5 explicitly calls for that Module 1.2 didn't originally include: `/reset-password` (set-new-password state) and `/auth/callback` (loading state for the OAuth/email-confirm redirect).
- No social-auth button anywhere — explicit master-prompt instruction, not an oversight.
- **Found and fixed a latent Module 2.4 bug**: `Input`/`Textarea`/`Select` were plain function components, not `forwardRef`-wrapped. `react-hook-form`'s `{...register(...)}` spread includes a `ref`, but spreading (vs. an explicit `ref=` attribute) bypasses TypeScript's excess-property check — so Module 2.4's forms passed `tsc` while the ref silently never reached the DOM input, meaning RHF's focus-first-invalid-field behavior never actually worked on any Module 2.4 content form. Only surfaced now because `PasswordInput` needed an _explicit_ `ref={ref}`, which `tsc` does check strictly. Fixed all three primitives; no form component needed changes.

Verification:

- `npm run typecheck` / `lint` (0 errors, same 8 pre-existing informational warnings) — pass
- `rm -rf .next && npm run build` — pass, 25 routes (added `/reset-password`, `/auth/callback`)
- Added `tests/unit/components/LoginForm.test.tsx` and `SignupForm.test.tsx` — inline validation, password-visibility toggle, and submit-enters-loading-state, following the Module 2.4 precedent of component tests over Browser-pane interaction testing.
- **Caught and fixed a real test flake during this module**: an early version waited for the post-submit "not connected" note via `findByText`, which depends on a real 500ms `setTimeout` — occasionally exceeded even a 3s timeout under the full suite's parallel load. Diagnosed with a temporary forced-failure assertion dumping the live DOM (confirmed the loading state activates correctly, immediately) rather than assuming; fixed by asserting on the synchronous loading-state transition instead of real wall-clock timing. Confirmed stable across 3 consecutive full-suite runs after the fix.
- Test suite: 53/53 passing (46 from Module 2.4 + 7 new).
- Route content spot-checked via `curl` against the production server for all 5 auth routes (200 status, correct heading/label text in the SSR HTML) rather than the Browser pane, per the Module 2.4 lesson.

Known issues:

- None blocking. Forms are UI-only by design — real submission is Module 3.1.

Next:

- Module 2.6 — Dashboard UI
