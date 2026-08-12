# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 3 — Features (Phase 2 — UI is COMPLETE, gate passed)
- **Current module:** 3.1 — Supabase Connection and Authentication (not yet started) — **blocked on live Supabase credentials**, see Current Blockers below
- **Last completed module:** 2.10 — Responsive and Accessibility UI Audit (COMPLETE — UI PHASE GATE PASSED)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -20` for the actual latest commit when resuming — as of writing, Modules 1.1–2.9 are committed and Module 2.10 is ready to commit.
- **Supabase integration status:** No live/hosted Supabase project connected. Local Docker Supabase has been used throughout Phase 1 for schema/RLS validation only. Module 3.1 is the first point a live/hosted project is actually needed.
- **Test status:** 92 unit/component tests passing. `typecheck`, `lint` (0 errors), `format:check`, and a fresh production `build` (25 routes) all pass.

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

**Module 3.1 needs a live/hosted Supabase project to actually connect to.** Per the master prompt's Credential Request Protocol (§15) and this session's standing instruction, request only the minimum needed to start: the project URL and anon/publishable key (for the browser client) — the service-role key is only needed for specific privileged server paths later (e.g. Module 3.7's scan-event writes) and must never reach a client bundle. Do not ask for more than that up front. If the user has no hosted project yet, offer to help create one, but the credentials themselves must come from the user — never guess or fabricate them.

## ⚠️ Read before doing browser-based verification

**This session's Browser pane cannot be trusted for interaction testing** (established Module 2.4, held through 2.5/2.6). Write a Vitest + Testing Library component test under `tests/unit/components/` for anything interactive — 17 such tests now exist across 5 components as reference patterns (forms with `userEvent`, a mocked-router active-link test in `DashboardSidebar.test.tsx`). For content/structure checks, `curl` against the production server (`npm run start`) is the established pattern for route-level checks — faster and more reliable than the Browser pane for this session.

**Two testing lessons banked from this phase**, worth reading before writing new tests:

1. Don't wait on real `setTimeout`-based delays via `findByText`/`findByRole` — assert on the synchronous state transition instead (Module 2.5 found this flakes under parallel test load even with a 3s timeout on a 500ms delay).
2. Write the test asserting the _specific, correct_ behavior (e.g. "only one nav item is current") before assuming an implementation is right — Module 2.6's naive active-link check looked reasonable but broke on two nav items sharing a URL prefix, and the test caught it immediately.

**A latent-bug pattern from Module 2.5, still relevant**: a plain (non-`forwardRef`) component silently accepts `{...someProps}` containing a `ref` without a `tsc` error (spread bypasses excess-property checking), but an explicit `ref={x}` on the same component does error. Keep any new form-field primitive `forwardRef`-wrapped.

## Next Exact Task

**Stop and ask the user for Supabase credentials before writing any Module 3.1 code** — this is a genuine blocking credential requirement (standing instruction rule #10), not something to work around or stub past. Request only: the project URL and anon/publishable key. Once provided:

1. Install `@supabase/supabase-js` and `@supabase/ssr`. Add real values to `.env.local` (never commit it — `.env.example` already documents the expected variable names from Module 1.1).
2. Build `src/lib/supabase/client.ts` (browser client) and `src/lib/supabase/server.ts` (server client, cookie-based session handling per `@supabase/ssr`'s Next.js App Router pattern — check `node_modules/next/dist/docs/` and Supabase's own SSR guidance for Next 16's async `cookies()`).
3. Wire real signup/login/logout/password-recovery behavior into the existing Module 2.5 forms (`LoginForm`, `SignupForm`, `ForgotPasswordForm`, `ResetPasswordForm`) — replace their stand-in `setTimeout` delay + "not connected yet" note with real Supabase Auth calls, preserving the existing validation/loading-state UX exactly as already built and tested.
4. Add profile creation/upsert on signup (writes to `profiles`, Module 1.4's table) — replaces `MOCK_PROFILE` on the real `/dashboard/account` page.
5. Add the protected-route strategy documented (but not yet implemented) since Module 1.2: a `proxy.ts` (not `middleware.ts` — renamed in Next 16) plus mandatory server-side re-checks on every `(dashboard)` route, per the "Protected-route strategy" section of `docs/ARCHITECTURE.md`.
6. Test signup, login, logout, protected-route redirect, authenticated dashboard load, session persistence, and the password-recovery request flow — the master prompt's own explicit test list for this module. Decide test approach once the real auth flow exists (likely a mix of component tests for form behavior and either integration tests or manual verification against the live/local Supabase project for the actual auth round-trip).
7. Never expose `SUPABASE_SERVICE_ROLE_KEY` to client bundles — only `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` belong in browser-reachable code.
8. Document in `docs/ARCHITECTURE.md`, mark Module 3.1 complete in `docs/WORKLOG.md`, commit. Continue autonomously into Module 3.2 (Static QR Generation) afterward, per the standing instruction's rule #5 — unless a further credential/blocking need arises first.

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. Next.js app at repo root (not a subfolder).
- Next.js 16.3.0 — check `node_modules/next/dist/docs/` before assuming v15-era behavior, including for Supabase SSR/auth-cookie patterns in Module 3.1. `params`/`searchParams`/`cookies()`/`headers()` are all async.
- **Tailwind v4** (`^4.3.3`), CSS-first `@theme` in `src/app/globals.css`. This project's `--radius-sm/md/lg` override Tailwind's own built-in radius scale of the same names.
- **Design system**: primary `#0F766E`. Use the `src/components/ui/` primitives (`Button`/`buttonVariants()`, `Card`, `Input`/`Textarea`/`Select`/`FormField`/`PasswordInput`/`Alert`/`AccordionItem`) rather than raw markup.
- **Three route-group layouts now exist**: `(marketing)` (Header/Footer, Module 2.2), `(auth)` (centered `AuthCard`, Module 2.5), `(dashboard)` (Sidebar + mobile drawer, Module 2.6). Don't duplicate any of their chrome inside individual pages.
- **Mock data**: `src/lib/qr/mock-data.ts` (`MOCK_QR_CODES` — 6 entries, `findMockQrCode(id)`, `MOCK_ANALYTICS_NOW`, `MOCK_SCAN_EVENTS`/`getMockScanEvents(id)`), `src/lib/account/mock-data.ts` (`MOCK_PROFILE`), `src/lib/files/mock-data.ts` (`MOCK_ASSETS`) — all Phase 2 stand-ins for real Supabase data, explicitly UI-only, replaced starting Module 3.1/3.5/3.8. Each domain gets its own mock file under `src/lib/<domain>/mock-data.ts` rather than one shared mock module — keep that convention for any future domain.
- **Component architecture**: `QRTypeSelector`/`QRContentPanel` read from `qrTypeRegistry` (`src/lib/qr/registry.ts`) — never hardcode a QR type list. `DASHBOARD_NAV_ITEMS` (`src/components/dashboard/nav-items.ts`) is the single source for dashboard nav — shared by `DashboardSidebar` and the mobile drawer. `QrPlaceholderGraphic` (`src/components/ui/QrPlaceholderGraphic.tsx`) is the single source for the abstract corner-square placeholder graphic. `src/lib/analytics/aggregate.ts` holds pure, reusable event-aggregation functions, kept separate from mock data. The QR codes list (Module 2.6) and Files list (Module 2.9) both use the same dual-render desktop-table/mobile-card-grid pattern (`hidden md:block` + `md:hidden` siblings) — follow it for any new list UI rather than a JS-driven responsive switch.
- **jsdom gap, resolved**: `HTMLDialogElement.prototype.showModal`/`.close` are unimplemented in this project's jsdom version — polyfilled globally in `tests/setup.ts` (registered via `vitest.config.mts`'s `setupFiles`, a no-op outside jsdom). Both `MobileNavDrawer` and `DeleteAssetButton` now have real dialog-based component tests using it.
- **Known, accepted Next.js limitation**: `notFound()` on this app returns HTTP 200, not 404, because the root `src/app/loading.tsx` (Module 1.1) creates a Suspense boundary above every route and streaming locks in the already-sent 200 status before `notFound()` (called after `await params`) can run. Documented in `docs/ARCHITECTURE.md` under Module 2.7 (and reconfirmed identically in Module 2.8). Not a regression to "fix" reflexively if it resurfaces elsewhere — it's structural to the current root layout.
- **No charting library installed on purpose** — Module 2.8's analytics charts (`BarChart`, `DistributionList`) are small hand-rolled CSS/flexbox components, matching the project's existing preference for hand-rolled visuals over new dependencies for Phase 2 mock-data UI. Don't add one without a real reason.
- **Local Supabase via Docker works on this machine** — `supabase/config.toml` exists, ports `54321`–`54329`. `supabase start` on an existing volume does **not** auto-apply new migrations — use `supabase db reset` after adding one.
- RLS design intentionally leaves two gaps that are **not bugs**: `qr_codes` has no `anon` SELECT policy, `qr_scan_events` has no client-facing INSERT policy at all.
- On this machine, port 3000 is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 — check the actual port before assuming, and never stop a process on 3000 without confirming its PID belongs to this project first.
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
