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

## Module 2.6 — Dashboard UI

Status: COMPLETE

Completed:

- Migrated the Module 1.6 dashboard skeletons (`DashboardSidebar`, `DashboardHeader`, `QRCodeCard`, `QRCodeTable`, `QRCodeStatusBadge`, `EmptyState`, `AnalyticsSummaryCards`) from `gray-*` placeholders to the Module 2.1 design tokens; `QRCodeCard`/`QRCodeTable` rows now link to the (still-stub) detail route.
- Converted `DashboardSidebar` to a Client Component using `usePathname()` for automatic active-link detection, dropping the manual `activePath` prop every caller previously had to pass.
- Extracted `DASHBOARD_NAV_ITEMS` to a shared `nav-items.ts` so `DashboardSidebar` and the new mobile drawer use one source; widened `MobileNavDrawer`'s prop type to accept a `readonly` array so a `const`-asserted nav list can be passed directly.
- Built `src/app/(dashboard)/layout.tsx`: `DashboardSidebar` on desktop, a compact mobile top bar reusing `MobileNavDrawer` (Module 2.2) rather than building a second drawer.
- Built the real `/dashboard` (Overview: stat cards + recent QR codes) and `/dashboard/qr-codes` (list: `QRCodeTable`/`QRCodeCard` switching purely via CSS breakpoints, empty state ready) pages using new mock data (`src/lib/qr/mock-data.ts`, 5 entries, explicitly Phase-2-only).

Verification:

- `npm run typecheck` / `lint` (0 errors, same 8 pre-existing warnings) / `format:check` — pass
- `rm -rf .next && npm run build` — pass, 25 routes unchanged in count
- **Found and fixed a real bug via test-first, not inspection**: the first `DashboardSidebar` active-link implementation used a naive `pathname.startsWith(item.href)` check, which breaks when one nav href is a literal prefix of another (`/dashboard/qr-codes` vs. `/dashboard/qr-codes/new` — visiting the `new` page would have marked both "QR Codes" and "Create QR" simultaneously `aria-current="page"`). Caught because the component test asserted only one link should be current and the naive version failed it. Fixed with `findActiveHref()`: pick the longest exact-or-segment-prefix match, not just any string prefix.
- Added 5 component tests: `EmptyState.test.tsx` (3) and `DashboardSidebar.test.tsx` (2, covering the bug above and a QR-detail-page case that must NOT collide with "Create QR"). Suite: 59/59 passing.
- Route content verified via `curl` against the production server (not the Browser pane): `/dashboard` and `/dashboard/qr-codes` both 200 with the expected mock QR names present in the SSR HTML; confirmed the desktop `<table>` headers are present in the markup alongside the mobile card grid (both branches render server-side, CSS picks which shows).

Known issues:

- `/dashboard/qr-codes/new`, `/dashboard/qr-codes/[id]` (detail/edit/analytics), `/dashboard/files`, `/dashboard/account`, `/dashboard/settings` remain `RouteStub`s — explicitly out of this module's scope (Modules 2.7/2.9 own them), not a defect.
- The empty state is verified via component test only, not visible in the live mock-data demo, since the demo data is intentionally non-empty to also prove list rendering works. Both are real, both are tested — just not simultaneously visible in one page load.

Next:

- Module 2.7 — QR Detail and Edit UI

## Module 2.7 — QR Detail and Edit UI

Status: COMPLETE

Completed:

- Extracted `src/components/ui/QrPlaceholderGraphic.tsx` from three duplicated inline-SVG copies (`Logo`, `QRPreviewPanel`, `GeneratorTeaser`) — the detail page's large preview needed a fourth copy, which was the actual trigger for the extraction. Placed under `ui/` rather than `qr/` since `layout/Logo` depending on `qr/` would be an odd dependency direction.
- Extended `src/types/qr-record.ts`'s `QRCodeSummary` with `createdAt`/`destinationSummary`; extended `MOCK_QR_CODES` accordingly and added `findMockQrCode(id)` to `src/lib/qr/mock-data.ts`.
- Built `/dashboard/qr-codes/[id]` (detail): large preview, name/status/type/mode, destination/content summary, created/updated timestamps, disabled download actions, Edit link, conditional analytics-summary card (dynamic mode only), and a visually separated "Danger zone" with disabled Archive/Delete.
- Built `/dashboard/qr-codes/[id]/edit`: reuses `QRGeneratorShell` (Module 2.4) directly rather than a parallel edit form, per the master prompt's explicit instruction to reuse generator components. `QRGeneratorShell` gained optional `variant?: "create" | "edit"` and `initialName?: string` props (default behavior unchanged when omitted).
- Real unsaved-changes tracking: `isDirty` compares every shell field against its initial value; shown via an "Unsaved changes" badge and a `disabled={!isDirty}` "Save Changes" button (edit mode only). A `beforeunload` listener (attached only while dirty) blocks browser close/reload/typed-URL navigation — genuinely tested, not just declared. In-app SPA navigation is explicitly **not** intercepted yet (no simple per-navigation confirm hook in the App Router; disproportionate effort to guard mock data with nothing real at risk before Module 3.5) — documented as a scope boundary, not silently dropped.
- Fixed `Reset` to restore `initialName` instead of always clearing to `""`, so it means "discard edits since load" correctly in both `create` and `edit` variants.
- Added a third `Alert` variant (`"info"`) for the edit page's neutral pre-fill note — `"success"` was semantically wrong for a non-completion message.

Verification:

- `npm run typecheck` / `lint` (0 errors, same 8 pre-existing informational warnings) / `format:check` — pass
- `rm -rf .next && npm run build` — pass, all 25 routes build
- Added `tests/unit/components/QRGeneratorShellEdit.test.tsx` (6 tests): no dirty indicator/disabled Save Changes pre-edit; both active post-edit; `beforeunload`'s `defaultPrevented` is `true` while dirty and `false` when clean (dispatched manually and asserted, not just declared present); Reset restores `initialName` and clears dirty state; `create` variant shows neither Save Changes nor the indicator. Suite: 65/65 passing, confirmed stable across 2 consecutive full-suite runs.
- Route content verified via `curl` against the production server: detail pages for a dynamic QR (analytics link present) and a static QR (analytics link absent); edit page shows the info note and "Save Changes".
- **Investigated, not glossed over**: `curl -i` against a nonexistent id (`/dashboard/qr-codes/999`) returns `HTTP/1.1 200 OK` with correct "not found" content, not a 404 status. Root-caused via Next.js's own bundled docs (`node_modules/next/dist/docs/01-app/02-guides/streaming.md`): once streaming begins — which happens as soon as a `loading.tsx` Suspense boundary renders — the already-sent 200 status can't change. The root `src/app/loading.tsx` (Module 1.1) covers every route, and both pages must `await params` (Next 16 async params) before they can call `notFound()`, so streaming is unavoidably underway first. Fixing this would mean removing/rescoping the app-wide root loading boundary — out of this module's scope, affects every route. Documented in `docs/ARCHITECTURE.md` as a known, understood Next.js limitation rather than claimed as correct or silently ignored.

Known issues:

- `notFound()` returns HTTP 200 instead of 404 on this app (see above) — a documented Next.js streaming constraint, not a Module 2.7 defect. Revisit only if a real requirement (e.g. SEO, monitoring) needs correct 404 status codes, which would require restructuring the root loading boundary.
- Edit page pre-fills only `name` from mock data — content/design pre-fill needs a real per-QR payload/design record, arriving with persistence in Module 3.5. Stated explicitly to the user via an `Alert`, not silently incomplete.
- Unsaved-changes guard does not cover in-app SPA navigation (sidebar links) — see above, explicit scope boundary.

Next:

- Module 2.8 — Analytics UI

## Module 2.8 — Analytics UI

Status: COMPLETE

Completed:

- Added `src/types/analytics.ts` (`QrScanEvent`, `AnalyticsDateRange`, `DistributionEntry`, `DayCount`) and `src/lib/analytics/aggregate.ts` — pure, data-source-agnostic functions (`filterEventsByRange`, `countScansOverTime`, `countByField`, `countByHour`) kept separate from mock data specifically so this logic carries over unchanged when Module 3.7 wires real `qr_scan_events` rows. All bucketing is UTC-based to avoid server/client hydration mismatches in the Client Component that consumes it.
- Extended `src/lib/qr/mock-data.ts` with `MOCK_ANALYTICS_NOW` (a fixed reference timestamp, not the real current time, for reproducible last-24h/7d/30d numbers) and `MOCK_SCAN_EVENTS`/`getMockScanEvents()` — a hand-authored, deterministic _recent-activity sample_ per dynamic QR code, not a literal replay of the existing lifetime `scanCount` totals. Added a 6th mock QR code ("Referral Program", dynamic, 0 scans) specifically to exercise the true "No scans yet" empty state, distinct from a QR code with real history but nothing inside the current filter window (id `5`, already archived with only old events).
- Replaced the `/dashboard/qr-codes/[id]/analytics` `RouteStub` with a real page: static-mode QR codes get an informative `Alert` ("Static QR codes don't track scans...") instead of empty/fake analytics; dynamic-mode QR codes render the new `AnalyticsView`.
- Migrated the Module 1.6 `AnalyticsFilters`/`AnalyticsChartShell` skeletons off `gray-*` placeholder classes onto design tokens; rewrote `AnalyticsFilters` from a display-only stub into a real controlled component (date-range buttons with `aria-pressed`, country/device `Select` filters). Left `AnalyticsSummaryCards` untouched (already token-based) and `AnalyticsChartShell`'s no-`children` empty-state behavior unchanged, since the Module 2.3 marketing homepage teaser still relies on it exactly as-is.
- Built `BarChart` and `DistributionList` (new, `src/components/analytics/`) — hand-rolled CSS/flexbox charts, no charting library added, matching this project's existing preference for small hand-rolled visuals over a new dependency (`QrPlaceholderGraphic` precedent).
- Built `AnalyticsView` (new, `"use client"`): owns date-range/country/device filter state, derives every aggregate via `useMemo`, and renders 5 chart cards (scans over time, hour of day, country, device type, browser & OS) plus 6 always-on summary cards (total, last 24h/7d/30d, top country, top device — computed from full history, unaffected by the active filter).
- **Deliberately did not implement** two items from the master prompt's Module 2.8 spec: "Unique/estimated unique scans" (the `qr_scan_events` schema stores no default per-visitor identifier — only an optional salted `ip_hash` populated when a documented legal/product need exists — so there's no honest way to dedupe a unique scan; the master prompt itself says not to display metrics the backend won't actually collect) and a "QR code" filter (redundant — this page is already scoped to one QR code by its route; no global analytics view exists in the current nav to make that filter meaningful). Both omissions are documented in `docs/ARCHITECTURE.md` as explicit scope decisions, not gaps.

Verification:

- `npm run typecheck` / `lint` (0 errors, same 8 pre-existing informational warnings) / `format:check` — pass
- `rm -rf .next && npm run build` — pass, all 25 routes build (route count unchanged, `[id]/analytics` was already counted as a dynamic route via its `RouteStub`)
- Added `tests/unit/analytics/aggregate.test.ts` (8 tests, plain Vitest, no DOM): range-filtering boundaries at each of 24h/7d/30d, zero-filled chronological day buckets, distribution sorting/percentages, hour-of-day bucketing.
- Added `tests/unit/components/AnalyticsView.test.tsx` (5 tests): true-empty state (0 lifetime scans, no filters rendered) vs. range-empty state (real history, nothing in the active window); summary cards reflect full history independent of the active date-range filter; default range is 7d and switching to 24h updates `aria-pressed` correctly; the country filter narrows the country-distribution chart's content.
- Suite: 78/78 passing, confirmed stable across 2 consecutive full-suite runs.
- Route content verified via `curl` against the production server: a populated dynamic QR (id `1`, full analytics UI), a static QR (id `2`, info message only, no chart UI), a zero-scan dynamic QR (id `6`, "No scans yet"), and a nonexistent id (`999`, confirms the Module 2.7 `notFound()`/HTTP-200 finding applies identically here, since this page follows the same `await params` → lookup → `notFound()` shape).

Known issues:

- `notFound()` returns HTTP 200 here too, for the same documented reason as Module 2.7 (root `loading.tsx` Suspense boundary + async `params`).
- "Unique scans" and the "QR code" filter are intentionally not implemented — see above, not defects.
- Chart interactivity (hover tooltips) relies on native `title` attributes rather than a custom tooltip component — acceptable for Phase 2 mock data; revisit only if real usage shows it's insufficient.

Next:

- Module 2.9 — Account, Files, Settings UI

## Module 2.9 — Account, Files, Settings UI

Status: COMPLETE

Completed:

- **Account** (`/dashboard/account`): `src/types/account.ts` + `src/lib/account/mock-data.ts` (`MOCK_PROFILE`) stand in for a `profiles` row joined with `auth.users.email`. New `Avatar` UI primitive (initials fallback when no `avatarUrl`). `AccountProfileForm` (new, RHF + Zod via `src/lib/validation/account/profile.ts`) edits display name only — email renders as a disabled, read-only field since it belongs to `auth.users`, not `profiles`, and this app never writes to it directly. Follows the exact validated Module 2.5 pattern: real client-side validation, a genuine loading state, an honest "not connected to a backend yet" `Alert` on submit. Password/security entry point is a disabled `Button` with an explanatory note.
- **Files** (`/dashboard/files`): `src/types/asset.ts` + `src/lib/files/mock-data.ts` (`MOCK_ASSETS`, 5 entries covering all 3 upload states and both linked/unlinked-to-a-QR-code cases) mirror `qr_assets` (Module 1.4). New `formatBytes` helper (`src/lib/utils/format-bytes.ts`). `AssetTable`/`AssetCard` reuse the exact dual-render desktop/mobile pattern from Module 2.6's QR codes list. `AssetUploadStateBadge` mirrors `QRCodeStatusBadge`.
- **Files delete is real, not disabled** — a deliberate exception to this app's "disable premature actions" convention, because the master prompt explicitly asks for a working delete-with-confirmation interaction. `DeleteAssetButton` (new) opens a native `<dialog>` confirmation (same modal pattern as `MobileNavDrawer`'s drawer). `FilesView` (new, `"use client"`) owns the asset list in local state — confirming delete removes the row from that state only, not from any backend; a reload restores the full mock list. Documented clearly (component comment + `docs/ARCHITECTURE.md`) so this isn't mistaken for real persistence. Real Storage/`qr_assets` deletion arrives with Module 3.8. "Upload file" stays a disabled button (needs Module 3.8's Storage integration).
- **Settings** (`/dashboard/settings`): 3 rows (default QR design, default download format, analytics privacy) taken directly from the master prompt's own "potential settings" list. Every control is a visibly disabled `Select` with a note on which future module wires it up — not an enabled control that silently does nothing, per the master prompt's explicit "avoid fake toggles" instruction.
- **Found and worked around a real jsdom gap while writing tests**: `HTMLDialogElement.prototype.showModal`/`.close` are unimplemented in this project's jsdom version (confirmed via an actual failing test — `TypeError: dialogRef.current?.showModal is not a function` — not assumed). This is also why `MobileNavDrawer` (Module 2.2) was never covered by a component test. Added a small polyfill (toggles the `open` attribute) scoped to `tests/unit/components/FilesView.test.tsx` rather than a global `vitest.config.mts` setup file, since it's the first test that needs it.

Verification:

- `npm run typecheck` / `lint` (0 errors, same 8 pre-existing informational warnings) / `format:check` — pass
- `rm -rf .next && npm run build` — pass, all 25 routes build
- Added `tests/unit/utils/format-bytes.test.ts` (4 tests), `tests/unit/components/AccountProfileForm.test.tsx` (3 tests: pre-filled/read-only fields, validation error on empty name, loading state on submit), `tests/unit/components/FilesView.test.tsx` (3 tests: linked-QR-name/Unlinked rendering, delete-then-empty-state, cancel-keeps-the-asset).
- Suite: 88/88 passing, confirmed stable across 2 consecutive full-suite runs.
- Route content verified via `curl` against the production server: `/dashboard/account` (profile name/email/Change password), `/dashboard/files` (both mock file names, an "Unlinked" entry, and linked QR code names), `/dashboard/settings` (all 3 setting rows).

Known issues:

- None blocking. Files delete is local-state-only by design (see above), not a defect. Account email/password and every Settings control are intentionally non-functional pending their respective Phase 3 modules.

Next:

- Module 2.10 — Responsive and Accessibility UI Audit

## Module 2.10 — Responsive and Accessibility UI Audit

Status: COMPLETE — **PHASE 2 (UI) GATE PASSED**

Audited every screen built across Modules 2.1–2.9 against the master prompt's checklist (navigation, generator, form labels, color controls, dialog focus trapping, keyboard use, sticky preview behavior, dashboard table overflow, chart readability, empty states, touch target sizes) by direct code review — component source, computed CSS token values, and the existing 88-test suite as evidence — rather than the Browser pane, per this session's established (and still valid) finding that it can't be trusted for layout/interaction verification here.

### Real defects found and fixed (not just catalogued — the master prompt requires fixing before Phase 3)

- **`/dashboard/qr-codes/new` was still the Module 1.1 `RouteStub`**, never wired to the real `QRGeneratorShell` — meaning every "Create QR" entry point in the dashboard (header action, Overview page, QR codes list page) led to a placeholder, not the actual generator. This fell through the cracks between Modules 2.6/2.7 (Module 2.6's known-issues note assigned it to "Modules 2.7/2.9," but neither module's own scope description actually claimed it). **This is the most important finding of this audit** — a broken primary user flow, not a cosmetic issue. Fixed by rendering `<QRGeneratorShell />` directly, the same pattern already used by the edit page.
- **`QRNameField` and `QRModeToggle`** (both part of the generator, used on every generator page) were never migrated to the Module 2.1 design system — they used raw hardcoded `gray-300`/`gray-700`/`gray-900` Tailwind classes instead of the `border`/`foreground`/`muted-foreground`/`primary` tokens, and `QRNameField` used a bare `<input>` instead of the shared `FormField`/`Input` primitives. Fixed: `QRNameField` now composes `FormField`+`Input` like every other field in the app; `QRModeToggle`'s selected/unselected states now match the segmented-control pattern already established in `AnalyticsFilters` (Module 2.8).
- **`RouteStub`, `not-found.tsx`, `error.tsx`, `loading.tsx`** also had raw `gray-*` classes left over from Module 1.1 (before the design system existed). `loading.tsx` in particular renders on effectively every route transition (it's the root Suspense boundary — see Module 2.7's `notFound()`/streaming finding), so its spinner color was visibly off-brand on every navigation. All four migrated to tokens.
- **`global-error.tsx` deliberately left unchanged.** It replaces the entire root layout (including `layout.tsx`'s `import "./globals.css"`), so there's no guarantee the design tokens — or even Tailwind's compiled utility classes — are reliably available when it renders; Next.js's own documented example for this exact file uses zero CSS classes for the same reason. Matching that framework convention (minimal, dependency-free markup) is more defensible here than forcing token consistency onto the one file that exists specifically for when everything else has failed.
- **Dashboard tables had no horizontal-overflow guard.** `QRCodeTable` (QR codes list) and `AssetTable` (Files) render inside a bare `hidden md:block` wrapper with no `overflow-x-auto` — a long file name or QR code name near the 768px breakpoint could overflow the layout instead of scrolling. Added `overflow-x-auto` to both wrappers (`src/app/(dashboard)/dashboard/qr-codes/page.tsx`, `src/components/files/FilesView.tsx`).

### Reviewed and confirmed correct, no change needed

- **Sticky preview** (`QRGeneratorShell`): `lg:sticky lg:top-20 lg:self-start`, gated to `lg:` where the two-column layout applies; confirmed no ancestor `overflow` rule in either the marketing or dashboard layout that would break `position: sticky`; `top-20` sits cleanly below the marketing `Header`'s `sticky top-0 h-16`.
- **Dialog focus trapping** (`MobileNavDrawer`, `DeleteAssetButton`): both use native `<dialog>` + `showModal()`, which gives focus trapping and Escape-to-close for free per the HTML spec — already the deliberate reason this pattern was chosen (see `MobileNavDrawer`'s Module 2.2 code comment). Verified via new component tests (see below), not just re-read as a comment.
- **Color controls** (`design-controls.tsx`): every `<input type="color">`/`type="range"`/`type="checkbox">` is a native, natively keyboard-operable control with a correctly associated `FormField` label (or valid implicit nested-label for checkboxes) — no custom widget reinventing keyboard behavior.
- **Touch targets**: the `sm` Button size (`h-8` = 32px, an intentional Module 2.1 design token — see `--control-height-sm` in `globals.css`) clears WCAG 2.5.8's AA minimum (24×24px) on every usage found. It's below the 44px Apple HIG / 48px Material best-practice recommendation for a few primary CTAs (Header's "Create QR Code," dashboard "Create QR" links) — noted here as a minor, non-blocking density choice rather than changed, since Module 2.1's control-height scale was already its own reviewed, deliberate decision and the AA-binding minimum is met.
- **Empty states**: QR codes list and Files list both have a real `EmptyState`; Analytics has two distinct empty states (true-zero vs. filtered-to-zero, Module 2.8). No list-type view is missing one.
- **Chart readability**: `AnalyticsView`'s chart grid is single-column below `lg:`, `BarChart`'s bars are `flex-1` (no fixed width to overflow at narrow widths), `AnalyticsFilters` wraps via `flex-wrap`.
- **`QRTypeSelector`'s ARIA pattern** (`role="listbox"`/`role="option"` with each `<button>` independently focusable) is a minor deviation from the full ARIA Authoring Practices listbox pattern (which expects roving `tabindex` + arrow-key navigation, with only the selected option in the tab sequence). Functionally every option is still reachable and operable via Tab+Enter today — nothing is broken or unreachable. Noted rather than rewritten: implementing full roving-tabindex across ~20 buttons is a real behavior change to a completed, tested Module 2.4 component, disproportionate to the marginal ARIA-purity gain, and risks destabilizing it right before Phase 3 for no functional benefit to a keyboard user.

### Test coverage added

- **`MobileNavDrawer`** (new, `tests/unit/components/MobileNavDrawer.test.tsx`, 4 tests) had no component test at all before this module — the reason turned out to be a real jsdom gap, not an oversight: `HTMLDialogElement.prototype.showModal`/`.close` are unimplemented in this project's jsdom version, confirmed in Module 2.9 via an actual failing test on `DeleteAssetButton`. That module's polyfill (scoped to one test file) is now promoted to `tests/setup.ts`, registered globally via `vitest.config.mts`'s `setupFiles` (guarded with `typeof HTMLDialogElement !== "undefined"` so it's a no-op for the many tests still running under the default `node` environment) — and extended to also dispatch the native `close` event, since `MobileNavDrawer` listens for it to sync its `open` state. `FilesView.test.tsx`'s now-redundant local copy was removed.
- New tests cover: closed by default, opening shows every link + the CTA, closing via the close button, closing via clicking a nav link — the actual focus-trap/Escape behavior itself is native browser behavior with no app code to unit-test, verified by design (see above) rather than re-implemented in a test.

### Verification

- `npm run typecheck` / `lint` (0 errors, same 8 pre-existing informational warnings) / `format:check` — pass
- `rm -rf .next && npm run build` — pass, all 25 routes build; `/dashboard/qr-codes/new` confirmed still a static route after being wired to a real (if unauthenticated-state-free) component
- `npm run test` — 92/92 passing (4 new), confirmed stable across 2 consecutive full-suite runs
- `curl` against the production server confirmed `/dashboard/qr-codes/new` now renders "Create a QR Code" / "QR name" (the real generator), not the old stub text

### UI Phase Completion Report

**1. Modules delivered.** 2.1 Visual Design System, 2.2 Public Header/Footer/Marketing Shell, 2.3 Home Page UI, 2.4 QR Generator UI, 2.5 Authentication UI, 2.6 Dashboard UI, 2.7 QR Detail and Edit UI, 2.8 Analytics UI, 2.9 Account/Files/Settings UI, 2.10 this audit — all 10 UI modules complete, each individually verified and committed in sequence per the module completion gate (implement → verify → document → commit) before the next began.

**2. Screens now real** (not `RouteStub`s): the homepage; `/qr-generator`; all 3 auth forms + reset-password + auth callback; the full dashboard (`/dashboard` overview, QR codes list, create, detail, edit, analytics, account, files, settings). Still intentionally `RouteStub`s: `/features`, `/pricing`, `/faq`, `/qr-types`, `/static-qr`, `/dynamic-qr`, `/terms`, `/privacy`, `/p/[slug]` — none of these have a dedicated Phase 2 module in the master prompt (only the homepage, Module 2.3, does), so they remain out of scope, not a defect.

**3. Design system.** One token set (`src/app/globals.css`, Module 2.1) applied consistently across every real screen as of this audit — the two components (`QRNameField`, `QRModeToggle`) and four app-level boundary files found still using pre-Module-2.1 raw colors are now migrated (see above); `global-error.tsx` is the one deliberate, reasoned exception.

**4. Testing.** 92 unit/component tests (up from 41 at the end of Phase 1) covering QR payload builders/validation, every interactive form and generator flow, dashboard active-link logic, analytics aggregation and filtering, the unsaved-changes guard, the Files delete-confirmation flow, and now the mobile nav drawer. Established methodology: Vitest + Testing Library for anything interactive (the Browser pane cannot be trusted for interaction/geometry verification in this session — a finding from Module 2.4, held for the rest of the phase), `curl` against the production server for route-level content checks.

**5. Known, accepted limitations carried into Phase 3** (all documented in `docs/ARCHITECTURE.md`, none blocking): `notFound()` returns HTTP 200 instead of 404 app-wide (root `loading.tsx` Suspense boundary + async `params`, Module 2.7); no "unique scans" analytics metric and no cross-QR-code analytics filter (schema/scope reasons, Module 2.8); Files delete is local-state-only until Storage integration (Module 3.8); every Account/Settings control beyond display-name editing is intentionally inert pending its respective Phase 3 module; `QRTypeSelector`'s ARIA listbox pattern is a minor, non-blocking deviation (this module).

**6. Credential requirements for Phase 3.** None needed yet. The first point a live Supabase credential becomes necessary is Module 3.1 — request only the minimum value for what's being wired up first when that module actually begins, not before.

### PHASE GATE: PASSED

Phase 2 (UI) is complete and verified. Proceeding to **Phase 3 — Features**, starting with Module 3.1 (Supabase Connection and Authentication).

## Module 3.1 — Supabase Connection and Authentication

Status: COMPLETE

Blocked, then unblocked: per standing instruction, stopped and asked for the minimum live credentials (project URL + anon/publishable key) before writing any code. The user supplied both. Full reasoning and design decisions are in `docs/ARCHITECTURE.md`'s "Supabase Connection and Authentication (Module 3.1)" section — this entry is the implementation/verification log.

Completed:

- Installed `@supabase/supabase-js` + `@supabase/ssr`. Added real values to `.env.local`.
- `src/lib/supabase/client.ts` (browser client), `server.ts` (server client, async `cookies()`), `dal.ts` (`getAuthenticatedUser()`, the mandatory secure re-check), `profile.ts` (`ensureProfile()` upsert helper).
- `src/proxy.ts` — optimistic cookie-based redirect for `/dashboard/*` (unauthenticated) and `/login`/`/signup` (authenticated).
- `(dashboard)/layout.tsx` now `async`, calls `getAuthenticatedUser()` before rendering — all 10 dashboard routes are now server-rendered dynamically (confirmed via build output) instead of static.
- Rewired `LoginForm`, `SignupForm`, `ForgotPasswordForm`, `ResetPasswordForm` to call real `supabase.auth.*` methods in place of the Module 2.5 `setTimeout` stand-ins, preserving validation/loading-state UX exactly.
- Replaced the static `auth/callback/page.tsx` with a `route.ts` Route Handler supporting both `token_hash`+`type` and `code` confirmation-link shapes.
- Added `src/lib/supabase/actions.ts`'s `logout()` Server Action and a `LogoutButton`, wired into both `DashboardSidebar` and (via a new `MobileNavDrawer` `footer` prop) the mobile nav drawer — there was no logout control anywhere in the app before this module.

Verification:

- `npm run format:check` / `typecheck` / `lint` (0 errors, same 8 pre-existing informational warnings) — pass
- `rm -rf .next && npm run build` — pass, all 25 routes build
- `npm run test` — **103/103 passing** (11 new/rewritten: `LoginForm`, `SignupForm` rewritten for real Supabase calls + error paths; new `ForgotPasswordForm.test.tsx`, `ResetPasswordForm.test.tsx`)
- **Live verification against the user's actual hosted project** (not just mocked tests) — see `docs/ARCHITECTURE.md` for the full breakdown. Summary: applied all 8 existing migrations to the previously-schema-less live project via `supabase link` + `supabase db push` (user supplied a personal access token + DB password specifically for this); added `http://localhost:3000/**` to the project's auth redirect allow list (was blocking `/auth/callback`); then verified signup, email-confirmation (simulated via direct SQL, since no inbox is reachable from this environment), login, wrong-password rejection, profile upsert against real RLS (via a script using the actual `@supabase/supabase-js` package, not curl), password-recovery request (correctly hit Supabase's own rate limit on a second attempt), protected-route redirect (`curl`), and — in the real Browser pane against the real dev server — login → authenticated dashboard load → session-persistence-across-reload → logout → session genuinely cleared. A throwaway test account was created and fully deleted afterward; confirmed zero rows left in `auth.users`/`profiles` post-cleanup.

Known issues:

- Account page (`/dashboard/account`) still shows `MOCK_PROFILE`, not the real signed-in user — this module's explicit scope is profile creation/upsert, not wiring every consumer of profile data, and no later master-prompt module is named for it either. Flagged as a real master-prompt gap in `docs/ARCHITECTURE.md`, not silently absorbed into this module's scope.
- `uri_allow_list` on the live project currently only covers `localhost:3000` — will need the production URL added once one exists (already a known, tracked future blocker, not new).

Next:

- Module 3.2 — Static QR Generation

## Module 3.2 — Static QR Generation

Status: COMPLETE

Completed:

- Installed `qrcode` + `@types/qrcode`. Added `src/lib/qr/render.ts`: `buildQrPayload()` (validates content against the type's existing Zod schema, then calls the existing registry payload builder — nothing re-implemented from Module 1.3), `renderQrSvg()`/`renderQrPngDataUrl()` (wrap `qrcode`'s `toString`/`toDataURL`, applying only the two solid colors from `DesignConfig`), `slugifyForFilename()`.
- `QRPreviewPanel` now renders a real, scannable QR (was `QrPlaceholderGraphic`) for all 9 static types with implemented content forms.
- `QRDownloadActions` gained working `Download PNG`/`Download SVG` buttons (`Save QR` stays disabled — Module 3.5).
- Full reasoning for the Module 3.2/3.3/3.4 scope boundaries (why only solid colors, why download is minimal-but-real rather than 3.4's full implementation) is in `docs/ARCHITECTURE.md`.

Verification:

- New `tests/unit/qr/render.test.ts` (12 tests) and rewritten/new component tests `QRPreviewPanel.test.tsx` (3) + `QRDownloadActions.test.tsx` (5) — see `docs/ARCHITECTURE.md` for what each covers.
- `npm run typecheck` / `lint` (0 errors, same 8 pre-existing warnings) / `format:check` — pass
- `rm -rf .next && npm run build` — pass, all 25 routes build
- `npm run test` — **123/123 passing**
- **Live browser click-through attempted, not completed**: the Browser pane's compositing limitation recurred (`read_page`/`screenshot` failed for this route this session) and a scripted native-input-value simulation didn't reach React Hook Form's `watch()` subscription in this environment. Not glossed over — recorded honestly in `docs/ARCHITECTURE.md` along with what _was_ verified (real component tests exercising the real library via real `userEvent` typing, a real production build, `curl` confirming the route serves). Worth a real click-through if the Browser pane's environment issue is resolved in a future session.
- One operational note: while stopping this session's dev server, used `Get-NetTCPConnection -LocalPort 3000` to find the exact PID and `Stop-Process -Id <pid>` — not a broad `taskkill /IM node.exe` (the mistake made in Module 3.1) — confirming the fix documented in `docs/SESSION_HANDOFF.md` holds.

Known issues:

- None blocking. Live interactive browser verification of the generator's preview/download UI (as opposed to its underlying logic, which is thoroughly tested) remains open for a future session with working Browser-pane compositing.

Next:

- Module 3.3 — QR Styling and Live Preview Engine

## Module 3.3 — QR Styling and Live Preview Engine

Status: COMPLETE

Completed:

- `src/lib/qr/matrix.ts`: raw QR module matrix + finder-region detection, the shared foundation for real per-module styling.
- `src/lib/qr/reliability.ts`: contrast-ratio warning, logo-size clamping, quiet-zone constant, logo-driven error-correction recommendation — the master prompt's "Reliability Rules" as real functions, not comments.
- `src/lib/qr/styled-svg.ts`: `renderStyledQrSvg()` (custom per-module SVG: pattern/eye shapes, gradients, logo overlay, frame+CTA) and `renderStyledQrPngDataUrl()` (derives PNG from that same SVG via Image+canvas). Falls back to Module 3.2's plain renderer on any error.
- `QRPreviewPanel` now debounces re-render (200ms) and shows reliability warnings inline instead of a generic "Scan to test" note when any apply.
- `QRDownloadActions` uses the styled renderers, so downloads match the live preview exactly.
- `DesignLogoControls`: real logo upload (`src/lib/qr/logo.ts`'s `readLogoFile()` — downsizes to ≤256px, returns a data URL), preview thumbnail, "Remove logo". Revises the Module 2.4/2.9-era assumption that this needed Supabase Storage first — full reasoning in `docs/ARCHITECTURE.md`.
- `QRDesignPanel` gained its own "Reset design" button (resets only `design`, distinct from the generator shell's full-form reset).

Verification:

- New tests: `tests/unit/qr/matrix.test.ts` (5), `reliability.test.ts` (9), `styled-svg.test.ts` (13), `styled-svg-png.test.ts` (4), `tests/unit/components/QRDesignPanel.test.tsx` (3); extended `QRPreviewPanel.test.tsx` (+2) and `QRDownloadActions.test.tsx`'s jsdom mocks (Image/canvas, since PNG download now goes through the styled SVG→canvas pipeline).
- `npm run typecheck` / `lint` (0 errors, same 8 pre-existing warnings) / `format:check` — pass
- `rm -rf .next && npm run build` — pass, all 25 routes build
- `npm run test` — **159/159 passing**
- No live browser click-through attempted this session (same Browser-pane compositing limitation noted in Module 3.2 — not re-attempted a second time this session).

Known issues:

- None blocking. Live interactive browser verification of the design controls remains open for a future session with working Browser-pane compositing, same as Module 3.2.

Next:

- Module 3.4 — QR Download and Export

## Module 3.4 — QR Download and Export

Status: COMPLETE

Completed:

- `QRDownloadActions` gained a "PNG size" selector (512/1024/2048px, default 1024), wired to `renderStyledQrPngDataUrl`'s existing `targetWidth` parameter — no new rendering logic needed. SVG has no size control (vector, always crisp) with a helper line saying so.
- `slugifyForFilename()` (`src/lib/qr/render.ts`) is now the complete policy: Unicode-normalizes and strips diacritics (`\p{M}`, not a hardcoded code-point range, so any script's combining marks are handled), length-capped at 60 chars. Windows-reserved device names deliberately not special-cased — reasoning in `docs/ARCHITECTURE.md`.

Verification:

- Extended `slugifyForFilename` tests (diacritics, CJK-only fallback, length cap, reserved-name input).
- New tests: resolution scaling verified across all 3 presets via the mocked canvas's `drawImage` args; logo presence confirmed in the exported PNG's source SVG; explicit transparent-background test at the SVG level; PNG size selector default + selected-size-reaches-canvas tests.
- `npm run typecheck` / `lint` (0 errors, same 8 pre-existing warnings) / `format:check` — pass
- `rm -rf .next && npm run build` — pass, all 25 routes build
- `npm run test` — **168/168 passing**

Known issues:

- None blocking. JPEG and print PDF skipped — both explicitly optional/conditional in the master prompt, and PNG+SVG already cover this app's real use cases.

Next:

- Module 3.5 — Saving and Managing QR Codes

## Module 3.5 — Saving and Managing QR Codes

Status: COMPLETE

Completed:

- Data layer: `src/lib/qr/records.ts` (DB row ↔ app-layer mapping, `deriveDestinationSummary`), `queries.ts` (`listQrCodes`/`getQrCodeById`, RLS-scoped read-only), `actions.ts` (`"use server"`: `saveQrCode`/`updateQrCode`/`duplicateQrCode`/`setQrCodeStatus`/`deleteQrCode`), `action-types.ts` (split out `AUTH_REQUIRED`/types — a `"use server"` file may only export async functions), `slug.ts` (random slug generator for dynamic mode).
- Consolidated saving onto `QRGeneratorShell`'s header (was two disabled buttons implying saving in two different places); real loading/error feedback, duplicate-submit guard, unauthenticated-save draft-and-redirect flow (`src/lib/qr/draft-storage.ts`), and genuine edit pre-fill (content/design/mode/type, not just name).
- `src/components/dashboard/QRCodeRowActions.tsx`: real Duplicate/Archive/Delete(-with-confirmation)/Download, used on both the dashboard list and the QR detail page.
- Dashboard overview, QR list (+ archived filter), detail, and edit pages all switched from `MOCK_QR_CODES` to real Supabase data. Detail page server-renders the real regenerated SVG preview directly.
- Fixed a real regression this module's own changes would otherwise have caused: the analytics page was still 100% mock-keyed and would 404 for every real QR — switched to real QR lookup with an honest empty-events state (Module 3.7 owns real scan tracking). Trimmed now-dead mock-data exports.

Verification:

- New tests (47): `records.test.ts` (10), `actions.test.ts` (14), `queries.test.ts` (7), `QRCodeRowActions.test.tsx` (7), `QRGeneratorShellSave.test.tsx` (5), `QRCodeCard.test.tsx` (4).
- `npm run typecheck` / `lint` (0 errors, same 8 pre-existing warnings) / `format:check` — pass
- `rm -rf .next && npm run build` — pass, all 25 routes build. **Caught a real bug this way, not via typecheck/lint**: a `"use server"` file exporting a plain constant alongside its async functions fails Next's build with an opaque "module has no exports" error — fixed by splitting the constant into `action-types.ts`.
- `npm run test` — **215/215 passing**
- **Live 2-user RLS verification against the real Supabase project** (not just RLS policies read on paper): a script using the real `@supabase/supabase-js` package signed in as two throwaway accounts and directly exercised insert/select/update/delete — 11/11 checks passed (User A save+read own; User B blocked from reading/updating/deleting User A's row, verified via exact affected-row counts, not just absence of an error; User A can update/archive/delete their own row). Both accounts and all test rows deleted immediately after; confirmed 0 rows left in `auth.users`/`qr_codes`/`profiles`.
- **Live browser click-through attempted, not completed**: hit Supabase's project-wide email rate limit trying to provision a fresh confirmed account for it (several confirmation emails already sent earlier this session). Documented honestly in `docs/ARCHITECTURE.md` rather than glossed over — relying on the live RLS check (the security-critical part) plus the 47 new automated tests as the verification record instead.

Known issues:

- None blocking. Full real-browser UI click-through of the save/duplicate/archive/delete flow remains open for a future session (same open item as Modules 3.2/3.3's Browser-pane limitation, plus this session's email-rate-limit constraint).

Next:

- Module 3.6 — Dynamic QR Codes

## Module 3.6 — Dynamic QR Codes

Status: COMPLETE

Completed:

- **Privileged redirect path, no service-role key needed**: new migration `20260818120000_add_redirect_rpc_functions.sql` adds two narrow `SECURITY DEFINER` Postgres functions — `resolve_qr_redirect(p_slug)` (returns only `destination_url`/`status`, never an internal id) and `record_qr_scan(p_slug, ...)` (atomically inserts a `qr_scan_events` row and increments `scan_count_cached`, keyed by slug so a caller can never target an arbitrary internal row id directly). Both are exactly the "privileged server-side path" Module 1.5's own RLS comment anticipated for `qr_scan_events`, and avoid ever needing to fill in `SUPABASE_SERVICE_ROLE_KEY` — that env var stays blank.
- `src/server/services/redirect-resolution.ts` implements the Module 1.2 stub for real, calling `resolve_qr_redirect` and defensively re-validating the stored destination is `http(s)` only (`src/lib/qr/redirect-url.ts`'s `isSafeRedirectTarget`) even though the `url` type's own Zod schema already enforces this at input time — open-redirect defense in depth, not reliance on a single layer.
- `src/app/r/[slug]/route.ts`: real `GET` handler. `export const dynamic = "force-dynamic"` so a destination edit is visible on the very next scan, no caching. 404 for an unknown/invalid slug, 410 for a paused/archived one, 307 redirect for `ok`. Scan recording is scheduled via `after()` (`next/server`) so it never delays the redirect response to the visitor.
- **The core architectural fix**: a dynamic QR's printed image now encodes this app's own `/r/[slug]` URL, never the raw destination — previously (through Module 3.5) dynamic mode was accepted end-to-end but nothing actually differentiated its _encoded payload_ from a static QR's, so a "dynamic" QR would have baked the raw destination directly into the image, defeating the entire point. New `resolveEncodedPayload(mode, qrType, content, slug)` in `src/lib/qr/render.ts` centralizes the mode-aware choice and is now the single call site used by `QRPreviewPanel`, `QRDownloadActions`, `QRCodeRowActions`, and the detail page's server-rendered preview (replacing their previous direct `buildQrPayload` calls).
- `destination_url` (schema column already existed since Module 1.4, unused until now) is populated by `saveQrCode`/`updateQrCode`/`duplicateQrCode` in `src/lib/qr/actions.ts` — denormalized from the already-validated content payload so the redirect route (no registry/payload-builder access inside a SQL function) can resolve it with a single flat column read. Editing a dynamic QR's content (e.g. changing the URL) re-derives `destination_url` while preserving the existing slug — "change destination without reprinting the code" falls straight out of the existing edit flow, no separate UI needed.
- **Pending-first-save UX**: a brand-new dynamic QR has no slug (and so no real scannable image) until the first save — `QRPreviewPanel`/`QRDownloadActions` now show an explicit "Save to generate your scannable dynamic QR code" state instead of silently rendering nothing or (worse) the raw content.
- Pause/Reactivate added to `QRCodeRowActions` for dynamic QRs (`active` ⟷ `paused`, hidden once archived) — reuses the existing generic `setQrCodeStatus` action from Module 3.5; the status badge already supported `paused` styling since the UI phase but had no control wired to it until now.
- QR detail page: a new "Printed QR links to" field shows the stable `/r/[slug]` link alongside the existing "Current destination" summary, making the indirection visible rather than implicit.

Verification:

- New tests (35): `render.test.ts` (+4, `resolveEncodedPayload`), `redirect-url.test.ts` (7), `redirect-resolution.test.ts` (6), `scan-tracking.test.ts` (4), `r-slug-route.test.ts` (5, the route handler itself — 404/410/307/scan-scheduling), `actions.test.ts` (+4, `destination_url` persistence on save/update/duplicate), `QRPreviewPanel.test.tsx` (+2), `QRCodeRowActions.test.tsx` (+4, pause/reactivate + dynamic download).
- `npm run typecheck` / `lint` (0 errors, same 8 pre-existing warnings) / `format:check` — pass
- `rm -rf .next && npm run build` — pass, all 25 routes build (route count unchanged — `/r/[slug]` already existed as a stub since Module 1.2); confirmed dynamic (ƒ) in the build output, not statically optimized.
- `npm run test` — **250/250 passing**
- **Live verification against the real Supabase project** (migration pushed via `supabase db push --linked`; confirmed both functions exist with `prosecdef = true`): temporarily enabled `mailer_autoconfirm` (avoids the project's SMTP rate limit hit in Module 3.5) to provision one throwaway confirmed account, seeded three real `qr_codes` rows directly (active, paused, and one with a `javascript:` destination inserted to bypass app-level validation on purpose), ran `npm run dev` and drove the real routes through the Browser pane:
  - active slug → real 307 redirect to the stored destination; `scan_count_cached` and a `qr_scan_events` row both confirmed incremented/inserted afterward.
  - paused slug → 410 `{"error":"inactive"}`.
  - unknown slug → 404 `{"error":"not_found"}`.
  - `javascript:` destination → 404 `{"error":"not_found"}` (confirms the redirect-time open-redirect check actually fires, not just the input-time Zod schema).
  - updated the active row's `destination_url` directly via SQL, re-requested the same slug — landed on the new destination immediately, proving no caching/staleness.
  - Cleanup: deleted all 3 test `qr_codes` rows and the throwaway auth account, restored `mailer_autoconfirm` to `false`; confirmed `count(*) = 0` on both `qr_codes` and `auth.users` afterward.

Known issues:

- None blocking. The nine `dynamicSupport: true` QR types that need a hosted landing page instead of a plain redirect (`pdf`, `app`, `images`, `video`, `social`, `multi_link`, `menu`, `feedback`, `audio` — already flagged `needsLandingPage: true` in the registry since Module 1.3) still have no real content form at all (`notYetImplementedQrSchema`), so they were out of scope here by construction, not a regression — Module 3.9 owns `/p/[slug]` and `landing_page_config`. Module 3.7 (Scan Analytics) still owns real device/OS/browser/geo parsing — `record_qr_scan`'s metadata parameters exist but only `referrer` is populated for now.

Next:

- Module 3.7 — Scan Analytics

## Module 3.7 — Scan Analytics

Status: COMPLETE

Completed:

- **Real metadata capture**: `src/lib/qr/user-agent.ts`'s hand-rolled `parseUserAgent()` (no new dependency — small, fully order-tested classifier, same reasoning as the hand-rolled charts in Module 2.8) classifies device type (mobile/tablet/desktop/unknown)/OS/browser from the raw User-Agent, correctly ordered so Edge/Opera aren't misread as Chrome and iOS isn't misread as macOS. `record_qr_scan` extended (new migration `20260819090000_extend_record_qr_scan_country.sql` — old 5-arg overload explicitly dropped first, since Postgres function identity includes the parameter list, not just defaults) with a `p_country_code` parameter.
- **Coarse geolocation, conditionally**: `src/app/r/[slug]/route.ts`'s `readEdgeCountryCode()` reads `x-vercel-ip-country`/`cf-ipcountry` — whichever a hosting platform's own edge network provides — never a geo-IP API call. Zero added latency, no third-party data sharing, genuinely `null` (not guessed) on hosting that provides neither.
- **Privacy-minimized by construction, not by omission**: no raw IP anywhere (unchanged from Module 1.4's `ip_hash`, still never populated); `QrScanEvent.countryCode` is nullable end-to-end and the UI (`AnalyticsView`) hides the entire Country filter/panel/summary-card when zero events have one, rather than rendering a misleading "100% Unknown" chart — "aggregate only where the data genuinely supports it," not just where a field happens to exist.
- **Efficient, not prematurely complex**: `listScanEvents()` (`src/lib/qr/queries.ts`) is a single RLS-scoped, indexed range query (`qr_code_id` + `scanned_at`, the exact composite index from Module 1.4) bounded to the last 30 days — the widest range the UI itself offers — reusing Module 2.8's already-tested pure `aggregate.ts` functions for the actual math instead of writing five separate SQL aggregation queries or any rollup/materialized view, per the master prompt's own "do not prematurely add complexity" instruction.
- **Analytics page wired to real data**: replaces Module 3.5's honest `events: []` placeholder with a real `listScanEvents()` read; loading/error states come from the existing root `loading.tsx`/`error.tsx` boundaries (no new per-route files needed); the true-empty and range-empty states (Module 2.8) render correctly against real (zero) data.
- **Redirect performance preserved**: scan recording still runs entirely inside `after()` (Module 3.6) — headers are read synchronously before scheduling it, UA parsing happens inside the deferred callback, none of it can delay the redirect response.
- **Privacy disclosure**: `/privacy`'s stub (Module 2.2, real copy deferred to Module 3.15 — "Legal and Privacy Readiness") now explicitly lists what Module 3.7 collects, so that module doesn't miss it; full disclosure documented in `docs/ARCHITECTURE.md`.

Verification:

- New tests (25): `user-agent.test.ts` (12, covering device/OS/browser classification including the Edge-vs-Chrome and iOS-vs-macOS substring-collision cases), `scan-records.test.ts` (4), `queries.test.ts` (+3, `listScanEvents`), `scan-tracking.test.ts` (rewritten for the new metadata-object signature, 4), `r-slug-route.test.ts` (+2, Vercel/Cloudflare country-header fallback), `AnalyticsView.test.tsx` (+1, no-country-data hides the whole Country UI).
- `npm run typecheck` / `lint` (0 errors, same 8 pre-existing warnings) / `format:check` — pass
- `rm -rf .next && npm run build` — pass, all 25 routes build
- `npm run test` — **272/272 passing**
- **Live verification against the real Supabase project**: pushed the migration, confirmed the old 5-arg `record_qr_scan` overload was actually dropped (not left as dead schema clutter) via `pg_proc`. Provisioned one throwaway confirmed account (`mailer_autoconfirm` toggle, Module 3.6's technique), seeded one dynamic QR, drove a real scan through the actual `/r/[slug]` route from the Browser pane with a spoofed `x-vercel-ip-country: US` header — the resulting `qr_scan_events` row showed `country_code: "US"`, `device_type: "desktop"`, `os: "Windows"`, `browser: "Chrome"`, `referrer` all correctly captured, parsed from the _real_ browser's own User-Agent, not a mocked one. Logged into the real dashboard as that test user and loaded the real analytics page: Total/24h/7d/30d scans, Top country, Top device, the Country/Device/OS/Browser distributions, and the date-range/country/device filters all rendered correctly from that one real event. Cleanup: deleted the test QR (scan events cascade), deleted the throwaway account, restored `mailer_autoconfirm` to `false`; confirmed `count(*) = 0` on `qr_codes`/`auth.users` afterward.

Known issues:

- None blocking. Real production Privacy Policy copy (disclosing this collection formally) is still Module 3.15's job — the stub now carries the exact disclosure content forward so it isn't lost.

Next:

- Module 3.8 — File-Based QR Types and Supabase Storage

## Account Entitlements — Permanent Pro Account Infrastructure

Status: COMPLETE (out-of-band request, not a numbered master-prompt module)

Completed:

- New migration `20260819120000_create_account_entitlements.sql`: `account_entitlements` table (`plan`, `is_lifetime`, `expires_at`), RLS with exactly one policy (owner-only `select`) — no insert/update/delete policy for any role, so an entitlement can only ever be granted/changed via a direct, privileged database operation.
- `src/lib/account/entitlements.ts`: `getMyEntitlement()` (missing row → `free`, by convention, not a trigger-maintained default row), `planLabel()`.
- `/dashboard/account` gained a small, fully-real "Plan" card (Free/Pro/Lifetime Pro) for the actually-signed-in user, independent of the rest of that page's still-mock content.
- Provisioned the requested permanent account, `mts.pk@hotmail.com` — Lifetime Pro owner account — via the same `mailer_autoconfirm` technique used for every throwaway verification account this session, the only difference being this one is never deleted. Its entitlement row was written directly via privileged CLI access, matching the same rule the RLS policy enforces for everyone else. Full design rationale and the exact verification record are in `docs/ARCHITECTURE.md`.
- Plaintext password never written to any repository file — a temporary provisioning script lived only in the session scratchpad and was deleted before this commit; confirmed via search that the password string appears nowhere in the repo.

Verification:

- New tests: `entitlements.test.ts` (7).
- `npm run typecheck`/`lint`/`format:check`/`build` — pass.
- `npm run test` — **279/279 passing** (includes Module 3.7's 272 plus these 7).
- Live verification against the real Supabase project: account exists and is confirmed, profile exists, entitlement is exactly `pro`/lifetime/no-expiry, login with the real password succeeds, logout-then-login succeeds, self-update of the entitlement affects 0 rows, a different user can neither read nor write this account's entitlement nor grant themselves one. Re-confirmed intact after Module 3.7's own test-data cleanup ran.

Known issues:

- None. Billing/upgrade UI is explicitly out of scope per the request — only the entitlement primitive and a read-only status badge exist.

## Dynamic QR Quota — Unlimited for the Permanent Account

Status: COMPLETE (out-of-band follow-up request, not a numbered master-prompt module)

Completed:

- New migration `20260819150000_add_dynamic_qr_limit.sql`: `account_entitlements.dynamic_qr_limit integer` (nullable — `NULL` is the explicit domain value for "unlimited," not a magic sentinel). The implicit free entitlement also resolves unlimited for now, since no commercial free-tier cap has been decided anywhere in this project yet — the enforcement mechanism is fully real, there's just nothing configured for it to restrict.
- `resolveDynamicQrAllowance()` (pure, `src/lib/account/entitlements.ts`) + `checkDynamicQrAllowance()` (`src/lib/qr/actions.ts`, does the actual DB reads, skips the count query entirely when unlimited) — wired into `saveQrCode`, `updateQrCode` (only on a static→dynamic conversion, never on an already-dynamic edit), and `duplicateQrCode` (only when duplicating a dynamic QR).
- `countDynamicQrCodes()` (`src/lib/qr/queries.ts`): active + paused count against a finite limit, archived doesn't — documented choice, mirrors archiving's existing role as this app's non-destructive "free up room" mechanism.
- Explicitly set the permanent account's `dynamic_qr_limit = null` (already the column default, but confirmed via an explicit, auditable `UPDATE`).
- `/dashboard/account`'s Plan card gained a "Dynamic QR codes" row — `Unlimited`, or `{count} / {limit}` for a finite plan; never a fabricated meter for an unlimited account.
- All enforcement is server-side (Server Actions) — no frontend email-based special case anywhere.

Verification:

- New tests (13): `entitlements.test.ts` (+4, `resolveDynamicQrAllowance`), `actions.test.ts` (+6), `queries.test.ts` (+3, `countDynamicQrCodes`).
- `npm run typecheck`/`lint`/`format:check`/`build` — pass.
- `npm run test` — **293/293 passing**.
- **Live verification, driving the real `saveQrCode` Server Action** (the Browser pane's client JS wasn't compositing the generator page this session — a temporary, uncommitted Route Handler called `saveQrCode` directly inside a real Next.js request instead, deleted before this commit): a throwaway account with a finite limit of 1 could create one dynamic QR, was rejected creating a second, could create a third after archiving the first (frees the slot), and was rejected again after pausing the new one (paused still counts). The permanent account created two dynamic QRs back to back with no rejection. Both self- and cross-user attempts to modify `dynamic_qr_limit` from the client affected 0 rows. `/r/[slug]` and scan analytics both re-verified working via one of the permanent account's test QRs. All test data and the throwaway account deleted afterward; confirmed exactly one `auth.users` row (the permanent account) and zero `qr_codes` rows remain.

Known issues:

- None. Full details, including the exact live-verification sequence, are in `docs/ARCHITECTURE.md`'s "Dynamic QR Quota" section.

## Module 3.8 — File-Based QR Types and Supabase Storage

Status: COMPLETE

Completed:

- **No service-role key needed, per the explicit instruction**: new migration `20260819180000_add_public_asset_read_policies.sql` adds a `SECURITY DEFINER` function, `qr_asset_is_publicly_readable(bucket, path)`, called from inside new `storage.objects` RLS policies on `qr-documents`/`qr-gallery`/`qr-media` (not `qr-logos` — those are only ever composited server-side) — grants `anon`/`authenticated` `select` only when the owning QR is `dynamic` and `active`. A plain subquery couldn't do this directly (it would run as the calling role and hit `qr_assets`/`qr_codes`'s own RLS), so a narrow privileged function does the join instead — same pattern as Module 3.6's `resolve_qr_redirect`, just used inside a Storage policy. `20260819180100_add_resolve_landing_page.sql` adds a second `SECURITY DEFINER` function, `resolve_landing_page(p_slug)`, mirroring `resolve_qr_redirect` for the new `/p/[slug]` page. Both validated live via direct RPC/`createSignedUrl` calls against a seeded row before any app code was written. `SUPABASE_SERVICE_ROLE_KEY` stays blank.
- **Four real QR types**: `pdf`, `images`, `audio`, `video` move from `notYetImplementedQrSchema` to real Zod schemas (`src/lib/validation/qr/`) and payload builders (`src/lib/qr/payload-builders/`). `pdf`/`images`/`audio` are dynamic-only, Storage-backed, and store their asset path(s) in `payload_data`. `video` is `staticSupport: true`/`needsStorage: false` — static encodes the raw external URL directly, dynamic wraps it in a hosted landing page; no self-hosted video storage, per the master prompt.
- `src/lib/qr/asset-upload.ts` uploads directly from the browser to Storage via the visitor's own authenticated session (no server round-trip). `src/lib/qr/asset-sync.ts`'s `syncQrAssets()` reconciles `qr_assets` rows (and the real Storage objects) against a QR's current content after every save/update; `deleteQrCode` (`src/lib/qr/actions.ts`) extended to remove the real Storage objects before the `qr_assets` rows are unreachable via `ON DELETE SET NULL`.
- **`/p/[slug]` built for real now** (Module 1.2 stub previously deferred to "Module 3.9" — corrected, since 3.8's own file types require it; 3.9 will extend the same mechanism, not build a second one): resolves via `resolve_landing_page`, renders `not_found`/`inactive`/a real type-switched landing component (`src/components/landing/{Pdf,Gallery,Audio,Video}LandingPage.tsx`). The three Storage-backed ones are async Server Components generating signed URLs server-side via `src/lib/qr/signed-asset-url.ts` (never throws, `null` on any failure → a graceful "not available" fallback).
- `resolveEncodedPayload` (Module 3.6) now branches dynamic-mode encoding on `needsLandingPage`: `/p/[slug]` for the four new types, `/r/[slug]` for everything else.
- Files page (`/dashboard/files`) wired to real data: `src/lib/files/{queries,actions}.ts` (`listQrAssets`/`deleteQrAsset`) replace the Module 2.9 mock; `deleteQrAsset` mirrors `deleteQrCode`'s Storage-then-row deletion order. `src/lib/qr/mock-data.ts` and `src/lib/files/mock-data.ts` deleted (confirmed zero remaining consumers first).

Verification:

- New tests (54): `pdf.test.ts`/`images.test.ts`/`audio.test.ts`/`video.test.ts`, `asset-upload.test.ts`, `asset-sync.test.ts`, `landing-page-resolution.test.ts`, `signed-asset-url.test.ts`, `render.test.ts` (+2), `registry.test.ts` (updated), `actions.test.ts` (+`deleteQrCode` Storage cleanup), `files/queries.test.ts`, `files/actions.test.ts`, `FilesView.test.tsx` (rewritten).
- `npm run typecheck` / `npx eslint .` (0 errors, same 9 pre-existing warnings) / `npx prettier --check .` — pass.
- `npx vitest run` — **347/347 passing** across 55 files.
- `rm -rf .next && npm run build` — pass, all routes build; `/dashboard/files` and `/p/[slug]` both dynamic (ƒ); no leftover `/api/test-only-*` routes.
- **Live verification against the real Supabase project**: both migrations pushed; PDF (upload → save → signed-URL landing render → pause revokes access → replace cleans up the old file+row → cross-user isolation → delete cleans up file+row), Gallery (multi-image, multi-asset cleanup), Audio (title/description, real playback URL), and Video (both dynamic-with-landing-page and static-direct-encode) all driven through the real Server Actions end to end via the temp-route technique, then fully cleaned up. Full detail and one explicitly scoped gap (the Files page's own list/delete path wasn't separately browser-driven this pass — blocked on a missing `SUPABASE_ACCESS_TOKEN` for the `mailer_autoconfirm` toggle, covered instead by 8 passing unit tests over the identical read/delete logic) are in `docs/ARCHITECTURE.md`.

Known issues:

- None blocking. See `docs/ARCHITECTURE.md`'s "Known issues" under Module 3.8 for the three minor, deliberately-accepted items (no audio artwork, no Storage-object copy on duplicate, one unreachable orphaned test blob) and the Files-page verification gap.

Next:

- Module 3.9 — Hosted Landing Page QR Types

## Module 3.9 — Hosted Landing Page QR Types

Status: COMPLETE

Completed:

- **Five remaining landing-page types built**: `app`, `social`, `multi_link`, `menu`, `feedback` move from `notYetImplementedQrSchema` to real Zod schemas (`src/lib/validation/qr/`) and payload builders. `app`'s registry entry corrected from `staticSupport: true` (a Module 1.3 default that turned out non-viable — three independent link fields, no single canonical one, and a device-aware CTA needs a server) to `false`, matching every other `needsLandingPage: true` type except `video`.
- **`payload_data` stays the single content store** for all five, same as Module 3.8's file types — `landing_page_config`'s own migration comment earmarked it for this module, but introducing a second read/write path for only 5 of 20 types would be real complexity for no functional gain given `payload_data` already works uniformly; documented explicitly in `docs/ARCHITECTURE.md` rather than silently diverging from that old comment.
- **`app`**: device-aware CTA ordering via `headers()` + Module 3.7's `parseUserAgent()` (iOS visitor sees the App Store link first, Android sees Google Play first), never hiding the other safe links. **`social`**: full profile page (avatar/description/ordered links/social icons/3 theme presets). **`multi_link`**: the bare-bones link-in-bio sibling, deliberately not sharing `social`'s schema. **`menu`**: flat item list with a free-text `category` field (not nested category arrays) and an optional per-item photo, reusing the `qr-gallery` bucket and its Module 3.8 public-read policy rather than a new bucket.
- **`feedback`, the one type with real anonymous write-back**: new migration `20260819190000_add_feedback_submissions.sql` — `qr_feedback_submissions` (owner-only read, zero write policy for any role) plus a `SECURITY DEFINER` RPC, `submit_qr_feedback(p_slug, ...)`, mirroring `record_qr_scan`'s "resolve the slug internally, silently no-op on any miss" pattern. `consent` is a pure app-layer gate (checked before the RPC is ever called) — never a stored column. A small, real "Feedback (N)" list was added to the QR detail page (`listQrFeedback()`, RLS-scoped, bounded to 50 rows) since collecting feedback with no way to view it would be a real gap.
- **Fixed in passing**: the QR detail page's "Printed QR links to" field always showed `/r/[slug]`, wrong for every `needsLandingPage: true` type since Module 3.8 (silently, for 4 types; now would've been wrong for 9). Now branches the same way `resolveEncodedPayload` does.

Verification:

- New tests (37): `app.test.ts`, `social.test.ts`, `multi-link.test.ts`, `menu.test.ts`, `feedback.test.ts`, `feedback-actions.test.ts`, `asset-sync.test.ts` (+1), `queries.test.ts` (+3), `registry.test.ts` (updated). One existing test (`QRGeneratorShell.test.tsx`) rewritten to assert actual list-membership change instead of a size comparison that stopped being meaningful once static/dynamic type counts became balanced.
- `npm run typecheck` / `npx eslint .` (0 errors, 11 pre-existing warnings) / `npx prettier --check .` — pass.
- `npx vitest run` — **386/386 passing** across 61 files.
- `rm -rf .next && npm run build` — pass, all routes build, no leftover `/api/test-only-*` routes.
- **Live verification against the real Supabase project**: migration pushed (using a `SUPABASE_ACCESS_TOKEN` the user supplied directly for this purpose — used only as an ephemeral shell variable, never written to any file). All 5 types driven through the real Server Actions end to end (App/Social/Multi-Link/Menu saved and rendered correctly on `/p/[slug]`; Menu's photo upload confirmed as a real `qr_assets` row serving real bytes via signed URL). Feedback's write-back was proven **genuinely anonymous** — a raw `curl` carrying only the Supabase anon key, no session at all, successfully inserted a real row via `submit_qr_feedback`; pausing the QR then made a second anonymous attempt silently no-op (same success response, zero new rows) rather than error; a direct anonymous `select` against `qr_feedback_submissions` returned zero rows (RLS-blocked); the owner's own feedback list correctly showed both real submissions. The `/r/` → `/p/` detail-page fix was confirmed live. All test data, the throwaway account, and a harmless unconfirmed account left over from Module 3.8 were cleaned up; `mailer_autoconfirm` restored to `false`; the temporary verification route removed. Final state: exactly one `auth.users` row (the permanent account) and zero test data anywhere. Full detail in `docs/ARCHITECTURE.md`.

Known issues:

- None blocking. The feedback list on the QR detail page is intentionally minimal (no pagination/export/per-row delete) — a scoped follow-up if ever needed.

Next:

- Module 3.10 — Dashboard Search, Filters, and Organization

## Module 3.10 — Dashboard Search, Filters, and Organization

Status: COMPLETE

Completed:

- **Real database queries, replacing two client-side-filtering anti-patterns**: `listQrCodesPage()` (`src/lib/qr/queries.ts`) pushes search (`ilike`, wildcard-escaped)/type/mode/status/folder filters, sort, and `.range()` pagination into the query itself, with Postgres's own `count: "exact"` for the total — never `array.length` after fetching everything. `/dashboard` (Overview) had the same anti-pattern (fetching every QR code just to `.length`/`.filter()`/`.reduce()`/sort-and-slice in JS) and is fixed in the same pass via a new `get_my_qr_code_stats()` RPC (plain SQL, not `SECURITY DEFINER` — RLS scopes it to the caller automatically) plus a 3-row `listQrCodesPage()` call for "Recent."
- New migration `20260820100000_add_qr_search_and_stats.sql`: enables `pg_trgm`, adds a GIN trigram index on `qr_codes.name` (real substring search at scale), one composite `(user_id, status, updated_at desc)` index covering the default list-view shape (deeper index tuning is Module 3.13's own audit, left there on purpose), and the stats RPC.
- **URL-driven filter bar** (`QRCodesFilterBar`): search (debounced 300ms)/type/mode/status/folder/sort all write straight to the page's own URL search params via `router.push()` — no separate client state, bookmarkable as a side effect. `parseQrListSearchParams()` (`src/lib/qr/list-filters.ts`) validates every raw param, silently dropping anything unrecognized rather than erroring the page.
- **Two distinct, correct empty states**: "you've never created a QR code" (true empty, with a Create CTA) vs. "your filters match nothing" (no-results, with a Clear-filters link) — the master prompt's own explicit requirement, live-verified as genuinely different states.
- **Pagination** (`Pagination`): plain `<Link>`s to `?page=N`, renders nothing at all for a single page.
- **Folders, deliberately minimal**: `qr_folders`/`qr_codes.folder_id` (schema+RLS since Module 1.4/1.5, unused until now) get real create/delete (no rename — a light organizational aid, not a file-manager) via `src/lib/folders/{queries,actions}.ts`, a folder filter, and a per-row `QRCodeFolderSelect`. Deleting a folder relies on the existing `ON DELETE SET NULL` — QR codes in it become unfiled, never deleted.

Verification:

- New tests (37): `queries.test.ts` (+13), `list-filters.test.ts` (11), `folders/queries.test.ts`, `folders/actions.test.ts`, `QRCodesFilterBar.test.tsx`, `Pagination.test.tsx`, `FolderManager.test.tsx`, `QRCodeFolderSelect.test.tsx`; 2 existing test files updated for the new `folderId` field. A real `userEvent` + `vi.useFakeTimers()` hang was found and fixed in the filter-bar debounce tests (switched to `fireEvent` + real-timer `waitFor`) — the hang was silently poisoning every later test in the same file since the fake-timer cleanup never ran after the hang.
- `npm run typecheck` / `npx eslint .` (0 errors, same 11 pre-existing warnings) / `npx prettier --check .` — pass.
- `npx vitest run` — **442/442 passing** across 68 files.
- `rm -rf .next && npm run build` — pass, all routes build.
- **Live verification against the real Supabase project**: migration pushed (`pg_trgm`, both indexes, and the non-`SECURITY DEFINER` stats RPC all confirmed). Seeded 6 real QR codes; search (including literal-`%`-in-name escaping), type/mode/status filters, sort, 2-page pagination, and the full folder create→assign→delete-leaves-QR-unfiled lifecycle all verified correct through the real `listQrCodesPage`/folder actions _and_ through direct navigation to filtered `/dashboard/qr-codes` URLs (server-rendered output matched). RLS on the new stats RPC confirmed via a genuinely anonymous `curl` call returning all-zero stats, not the real signed-in user's numbers. All test data, the throwaway account, and the temp route cleaned up; `mailer_autoconfirm` restored to `false`. Final state: exactly one `auth.users` row (the permanent account, confirmed untouched) and zero `qr_codes`/`qr_folders` rows anywhere. Full detail in `docs/ARCHITECTURE.md`.

Known issues:

- None blocking. Folder rename isn't supported (create/delete only) — deliberate scope decision. See `docs/ARCHITECTURE.md`'s "Known issues" under Module 3.10 for the one other minor, explicitly-scoped item (large-dataset pagination proven via the query layer + component tests, not 20+ real seeded rows).

Next:

- Module 3.11 — QR Status, Duplicate, Archive, and Safe Delete
