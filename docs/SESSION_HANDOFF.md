# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 2 — UI
- **Current module:** 2.9 — Account, Files, Settings UI (not yet started)
- **Last completed module:** 2.8 — Analytics UI (COMPLETE)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -20` for the actual latest commit when resuming — as of writing, Modules 1.1–2.7 are committed and Module 2.8 is ready to commit.
- **Supabase integration status:** No live/hosted Supabase project. Not needed for any of Phase 2. First live credential need is Module 3.1.
- **Test status:** 78 unit/component tests passing. `typecheck`, `lint` (0 errors), `format:check`, and a fresh production `build` (25 routes) all pass.

## Relevant Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run start         # production server
npm run typecheck
npm run lint
npm run format:check
npm run test

# Local Supabase (Docker required, fully offline, no account needed):
supabase start        # reuses existing DB volume; does NOT auto-apply new migrations
supabase db reset     # drops + recreates from supabase/migrations/*.sql + seed.sql
supabase stop
```

## Current Blockers

None.

## ⚠️ Read before doing browser-based verification

**This session's Browser pane cannot be trusted for interaction testing** (established Module 2.4, held through 2.5/2.6). Write a Vitest + Testing Library component test under `tests/unit/components/` for anything interactive — 17 such tests now exist across 5 components as reference patterns (forms with `userEvent`, a mocked-router active-link test in `DashboardSidebar.test.tsx`). For content/structure checks, `curl` against the production server (`npm run start`) is the established pattern for route-level checks — faster and more reliable than the Browser pane for this session.

**Two testing lessons banked from this phase**, worth reading before writing new tests:

1. Don't wait on real `setTimeout`-based delays via `findByText`/`findByRole` — assert on the synchronous state transition instead (Module 2.5 found this flakes under parallel test load even with a 3s timeout on a 500ms delay).
2. Write the test asserting the _specific, correct_ behavior (e.g. "only one nav item is current") before assuming an implementation is right — Module 2.6's naive active-link check looked reasonable but broke on two nav items sharing a URL prefix, and the test caught it immediately.

**A latent-bug pattern from Module 2.5, still relevant**: a plain (non-`forwardRef`) component silently accepts `{...someProps}` containing a `ref` without a `tsc` error (spread bypasses excess-property checking), but an explicit `ref={x}` on the same component does error. Keep any new form-field primitive `forwardRef`-wrapped.

## Next Exact Task

Start Module 2.9 (Account, Files, Settings UI) — the master prompt's exact spec (re-read it before building, don't assume):

1. **Account** (`/dashboard/account`, currently a `RouteStub`): display name, email (read-only or a change flow if one is genuinely supportable without a backend yet — probably read-only for now, Module 3.1 wires real auth), avatar, and a password/security entry point (likely just a link to a not-yet-functional flow, consistent with how auth forms in Module 2.5 were UI-only).
2. **Files** (`/dashboard/files`, currently a `RouteStub`): uploaded asset list/grid — file type, size, linked QR codes, upload state, delete action with confirmation. Will need new mock data (a mock asset list) — extend `src/lib/qr/mock-data.ts` or add a sibling mock file, matching whichever is the better fit once you see the shape needed.
3. **Settings** (`/dashboard/settings`, currently a `RouteStub`): the master prompt says to "initially limit to settings that actually exist" and explicitly warns "avoid fake toggles" — so scope this conservatively (e.g. default QR design, default download format, analytics privacy preference) rather than building a large settings page of non-functional switches.
4. Reuse `src/components/ui/` primitives throughout (`Card`, `Button`, `Alert`, form primitives) rather than new one-off markup, consistent with every prior UI module.
5. Document in `docs/ARCHITECTURE.md`, mark Module 2.9 complete in `docs/WORKLOG.md`, commit. This is the last module before the Module 2.10 UI-phase gate — do not begin Phase 3 until that gate passes (standing instruction rule #6).

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. Next.js app at repo root (not a subfolder).
- Next.js 16.3.0 — check `node_modules/next/dist/docs/` before assuming v15-era behavior. `params`/`searchParams` are async everywhere, including `[id]`/`[slug]` pages you're about to build in Module 2.7.
- **Tailwind v4** (`^4.3.3`), CSS-first `@theme` in `src/app/globals.css`. This project's `--radius-sm/md/lg` override Tailwind's own built-in radius scale of the same names.
- **Design system**: primary `#0F766E`. Use the `src/components/ui/` primitives (`Button`/`buttonVariants()`, `Card`, `Input`/`Textarea`/`Select`/`FormField`/`PasswordInput`/`Alert`/`AccordionItem`) rather than raw markup.
- **Three route-group layouts now exist**: `(marketing)` (Header/Footer, Module 2.2), `(auth)` (centered `AuthCard`, Module 2.5), `(dashboard)` (Sidebar + mobile drawer, Module 2.6). Don't duplicate any of their chrome inside individual pages.
- **Mock data**: `src/lib/qr/mock-data.ts` (`MOCK_QR_CODES` — 6 entries now, including a genuinely zero-scan dynamic one — `findMockQrCode(id)`, `MOCK_ANALYTICS_NOW`, `MOCK_SCAN_EVENTS`/`getMockScanEvents(id)`) is the Phase 2 stand-in for real Supabase data — explicitly UI-only, replaced in Module 3.5. Extend it (or add a sibling mock file) if Module 2.9 needs a mock asset list for Files.
- **Component architecture**: `QRTypeSelector`/`QRContentPanel` read from `qrTypeRegistry` (`src/lib/qr/registry.ts`) — never hardcode a QR type list. `DASHBOARD_NAV_ITEMS` (`src/components/dashboard/nav-items.ts`) is the single source for dashboard nav — shared by `DashboardSidebar` and the mobile drawer. `QrPlaceholderGraphic` (`src/components/ui/QrPlaceholderGraphic.tsx`) is the single source for the abstract corner-square placeholder graphic — used by `Logo`, `QRPreviewPanel`, `GeneratorTeaser`, and the QR detail page; don't reintroduce inline copies. `src/lib/analytics/aggregate.ts` holds pure, reusable event-aggregation functions — keep this pattern (pure functions separate from mock data) if Module 2.9's Files page needs similar derived stats.
- **Known, accepted Next.js limitation**: `notFound()` on this app returns HTTP 200, not 404, because the root `src/app/loading.tsx` (Module 1.1) creates a Suspense boundary above every route and streaming locks in the already-sent 200 status before `notFound()` (called after `await params`) can run. Documented in `docs/ARCHITECTURE.md` under Module 2.7 (and reconfirmed identically in Module 2.8). Not a regression to "fix" reflexively if it resurfaces elsewhere — it's structural to the current root layout.
- **No charting library installed on purpose** — Module 2.8's analytics charts (`BarChart`, `DistributionList`) are small hand-rolled CSS/flexbox components, matching the project's existing preference for hand-rolled visuals over new dependencies for Phase 2 mock-data UI. Don't add one without a real reason.
- **Local Supabase via Docker works on this machine** — `supabase/config.toml` exists, ports `54321`–`54329`. `supabase start` on an existing volume does **not** auto-apply new migrations — use `supabase db reset` after adding one.
- RLS design intentionally leaves two gaps that are **not bugs**: `qr_codes` has no `anon` SELECT policy, `qr_scan_events` has no client-facing INSERT policy at all.
- On this machine, port 3000 is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 — check the actual port before assuming, and never stop a process on 3000 without confirming its PID belongs to this project first.
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
