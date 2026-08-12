# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 2 — UI
- **Current module:** 2.10 — Responsive and Accessibility UI Audit (not yet started) — the UI phase gate; Phase 3 cannot begin until it passes
- **Last completed module:** 2.9 — Account, Files, Settings UI (COMPLETE)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -20` for the actual latest commit when resuming — as of writing, Modules 1.1–2.8 are committed and Module 2.9 is ready to commit.
- **Supabase integration status:** No live/hosted Supabase project. Not needed for any of Phase 2. First live credential need is Module 3.1.
- **Test status:** 88 unit/component tests passing. `typecheck`, `lint` (0 errors), `format:check`, and a fresh production `build` (25 routes) all pass.

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

Start Module 2.10 (Responsive and Accessibility UI Audit) — this is the **UI phase completion gate**; Phase 3 (Supabase/auth/real data) cannot begin until it passes (standing instruction rule #6). The master prompt's exact spec:

1. Audit every built screen (marketing, auth, dashboard overview/list/detail/edit/analytics/account/files/settings) across 5 representative widths: small mobile, large mobile, tablet, laptop, desktop.
2. Specifically check: navigation (header/footer/sidebar/mobile drawer), the generator, form labels, color controls, dialog focus trapping (`MobileNavDrawer`, `DeleteAssetButton`), keyboard use, sticky preview behavior (`QRGeneratorShell`'s preview panel), dashboard table overflow (`QRCodeTable`/`AssetTable` on narrow widths), chart readability (Module 2.8's `BarChart`/`DistributionList`), empty states, and touch target sizes.
3. **Given this session's established Browser-pane limitations** (see the warning section above — no compositing/geometry, no reliable click interaction), don't rely on it for this audit either. Use `getComputedStyle` + `resize_window` breakpoint-matching for layout/responsive checks, read the actual Tailwind classes in each component for a static audit (e.g. does every interactive element have an adequate touch target class, does every form input have an associated `FormField`/label), and lean on the existing 88 component tests as evidence for keyboard/interaction correctness where they already cover it. Write new component tests for anything audited that isn't already covered.
4. Fix any real defects found before writing the report — this module explicitly says "fix all important UI defects before Phase 3," not just catalog them.
5. Produce a **UI Phase Completion Report** — follow the precedent already set by the "Structure Phase Completion Report" section inside Module 1.7's entry in `docs/WORKLOG.md` (search for that heading), not a new standalone file, covering all 10 UI modules (2.1–2.10).
6. Document in `docs/ARCHITECTURE.md`, mark Module 2.10 complete in `docs/WORKLOG.md`, commit. Only after this gate passes, move to Phase 3 Module 3.1 (Supabase Connection and Authentication) — this is the first module that may need live Supabase credentials; request only the minimum required values when that point is actually reached, never before.

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. Next.js app at repo root (not a subfolder).
- Next.js 16.3.0 — check `node_modules/next/dist/docs/` before assuming v15-era behavior. `params`/`searchParams` are async everywhere, including `[id]`/`[slug]` pages you're about to build in Module 2.7.
- **Tailwind v4** (`^4.3.3`), CSS-first `@theme` in `src/app/globals.css`. This project's `--radius-sm/md/lg` override Tailwind's own built-in radius scale of the same names.
- **Design system**: primary `#0F766E`. Use the `src/components/ui/` primitives (`Button`/`buttonVariants()`, `Card`, `Input`/`Textarea`/`Select`/`FormField`/`PasswordInput`/`Alert`/`AccordionItem`) rather than raw markup.
- **Three route-group layouts now exist**: `(marketing)` (Header/Footer, Module 2.2), `(auth)` (centered `AuthCard`, Module 2.5), `(dashboard)` (Sidebar + mobile drawer, Module 2.6). Don't duplicate any of their chrome inside individual pages.
- **Mock data**: `src/lib/qr/mock-data.ts` (`MOCK_QR_CODES` — 6 entries, `findMockQrCode(id)`, `MOCK_ANALYTICS_NOW`, `MOCK_SCAN_EVENTS`/`getMockScanEvents(id)`), `src/lib/account/mock-data.ts` (`MOCK_PROFILE`), `src/lib/files/mock-data.ts` (`MOCK_ASSETS`) — all Phase 2 stand-ins for real Supabase data, explicitly UI-only, replaced starting Module 3.1/3.5/3.8. Each domain gets its own mock file under `src/lib/<domain>/mock-data.ts` rather than one shared mock module — keep that convention for any future domain.
- **Component architecture**: `QRTypeSelector`/`QRContentPanel` read from `qrTypeRegistry` (`src/lib/qr/registry.ts`) — never hardcode a QR type list. `DASHBOARD_NAV_ITEMS` (`src/components/dashboard/nav-items.ts`) is the single source for dashboard nav — shared by `DashboardSidebar` and the mobile drawer. `QrPlaceholderGraphic` (`src/components/ui/QrPlaceholderGraphic.tsx`) is the single source for the abstract corner-square placeholder graphic. `src/lib/analytics/aggregate.ts` holds pure, reusable event-aggregation functions, kept separate from mock data. The QR codes list (Module 2.6) and Files list (Module 2.9) both use the same dual-render desktop-table/mobile-card-grid pattern (`hidden md:block` + `md:hidden` siblings) — follow it for any new list UI rather than a JS-driven responsive switch.
- **jsdom gap**: `HTMLDialogElement.prototype.showModal`/`.close` are unimplemented in this project's jsdom version. `tests/unit/components/FilesView.test.tsx` has a small polyfill at the top of the file (scoped to that file). `MobileNavDrawer` (Module 2.2) still has no component test for this reason — Module 2.10's audit may want to add one using the same polyfill.
- **Known, accepted Next.js limitation**: `notFound()` on this app returns HTTP 200, not 404, because the root `src/app/loading.tsx` (Module 1.1) creates a Suspense boundary above every route and streaming locks in the already-sent 200 status before `notFound()` (called after `await params`) can run. Documented in `docs/ARCHITECTURE.md` under Module 2.7 (and reconfirmed identically in Module 2.8). Not a regression to "fix" reflexively if it resurfaces elsewhere — it's structural to the current root layout.
- **No charting library installed on purpose** — Module 2.8's analytics charts (`BarChart`, `DistributionList`) are small hand-rolled CSS/flexbox components, matching the project's existing preference for hand-rolled visuals over new dependencies for Phase 2 mock-data UI. Don't add one without a real reason.
- **Local Supabase via Docker works on this machine** — `supabase/config.toml` exists, ports `54321`–`54329`. `supabase start` on an existing volume does **not** auto-apply new migrations — use `supabase db reset` after adding one.
- RLS design intentionally leaves two gaps that are **not bugs**: `qr_codes` has no `anon` SELECT policy, `qr_scan_events` has no client-facing INSERT policy at all.
- On this machine, port 3000 is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 — check the actual port before assuming, and never stop a process on 3000 without confirming its PID belongs to this project first.
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
