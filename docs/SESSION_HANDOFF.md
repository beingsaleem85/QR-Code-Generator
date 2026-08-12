# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 2 — UI
- **Current module:** 2.6 — Dashboard UI (not yet started)
- **Last completed module:** 2.5 — Authentication UI (COMPLETE)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -18` for the actual latest commit when resuming — as of writing, Modules 1.1–2.4 are committed and Module 2.5 is ready to commit.
- **Supabase integration status:** No live/hosted Supabase project. Not needed for any of Phase 2. First live credential need is Module 3.1.
- **Test status:** 53 unit/component tests passing (46 from Module 2.4 + 7 auth-form tests). `typecheck`, `lint` (0 errors), `format:check`, and a fresh production `build` (25 routes) all pass.

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

**This session's Browser pane cannot be trusted for interaction testing** (established Module 2.4, held true through Module 2.5). For interaction/behavior verification, write a Vitest + Testing Library component test under `tests/unit/components/` — this is the established, reliable method now, with 12 such tests across 3 components. For content/structure checks, `curl` against the production server (`npm run start`) or the Browser pane's `textContent`/`getComputedStyle` remain trustworthy. Don't trust Browser-pane click simulation, `getBoundingClientRect`, or screenshots this session.

**A second lesson from Module 2.5**: tests that wait on a real `setTimeout` (e.g. a stand-in loading delay) via `findByText`/`findByRole` can flake under the full suite's parallel load even with a generous timeout (3s wasn't always enough for a 500ms delay). Prefer asserting on the _synchronous_ state transition (e.g. the button becomes disabled with loading text) immediately after the triggering interaction, rather than waiting for the delayed completion state. If you must wait on real timing, verify stability with 2-3 consecutive full-suite runs, not just one pass.

**A latent bug pattern to watch for**: a plain (non-`forwardRef`) component silently accepts `{...someProps}` containing a `ref` without a TypeScript error (spread bypasses excess-property checking), but explicitly writing `ref={x}` on the same component _does_ error. This means spread-based ref passing can silently fail at runtime while `tsc` stays green. `Input`, `Textarea`, `Select`, and now `PasswordInput` are all `forwardRef`-wrapped — keep any new form-field primitive the same way.

## Next Exact Task

Start Module 2.6 (Dashboard UI):

1. Build the authenticated dashboard layout: `DashboardSidebar` + `DashboardHeader` (both already exist as Module 1.6 skeletons under `src/components/dashboard/` — verify they still match current design tokens, update if not) wired into a new `src/app/(dashboard)/layout.tsx` (this group currently has no layout, like `(auth)` didn't before Module 2.5).
2. Build the Overview screen (`/dashboard`) with stat placeholders (Total QR Codes, Dynamic QR Codes, Total Scans, Scans this period) and a recent-QR-codes list — using mock/local data (no Supabase yet), per Phase 2's charter.
3. Build out the QR code list (`/dashboard/qr-codes`) using `QRCodeCard`/`QRCodeTable` (existing Module 1.6 components) with mock data, switching between card/table by viewport per master prompt §2.6.
4. Add a strong empty state (existing `EmptyState` component) for a new user with zero QR codes.
5. Mobile: sidebar collapses to a drawer — likely reuse the `MobileNavDrawer` pattern from Module 2.2 (native `<dialog>`) rather than building a second drawer implementation from scratch.
6. Verify via component tests (per the note above) for anything genuinely interactive (drawer toggle, card/table switching if it's JS-driven rather than pure CSS), plus `curl`/content checks for the rest.
7. Document in `docs/ARCHITECTURE.md`, mark Module 2.6 complete in `docs/WORKLOG.md`, commit. Continue autonomously to Module 2.7 (QR Detail and Edit UI) afterward.

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. Next.js app at repo root (not a subfolder).
- Next.js 16.3.0 — check `node_modules/next/dist/docs/` before assuming v15-era behavior.
- **Tailwind v4** (`^4.3.3`), CSS-first `@theme` in `src/app/globals.css`. This project's `--radius-sm/md/lg` override Tailwind's own built-in radius scale of the same names — intentional, see "Design System" in `docs/ARCHITECTURE.md`.
- **Design system**: primary `#0F766E`. Use `Button`/`buttonVariants()`, `Card`, `Input`/`Textarea`/`Select`/`FormField`/`PasswordInput`/`Alert` (all under `src/components/ui/`) rather than raw markup.
- **Forms**: React Hook Form + `zodResolver` against a schema under `src/lib/validation/{qr,auth}/` + the `FormField`/`Input`-family primitives. All form-field primitives must be `forwardRef`-wrapped (see the bug note above).
- **lucide-react is v1.31.0** — verify an icon export name exists before assuming it (`node -e "console.log(typeof require('lucide-react').IconName)"`).
- **Marketing shell** (Module 2.2): `Header`/`Footer`/`Logo`/`MobileNavDrawer` under `src/components/layout/`, wired via `(marketing)/layout.tsx`. **Auth shell** (Module 2.5): `AuthCard` under `src/components/auth/`, wired via `(auth)/layout.tsx`. `(dashboard)` still has no layout — that's next.
- **Component architecture** (Module 1.6): `QRTypeSelector`/`QRContentPanel` read from `qrTypeRegistry` (`src/lib/qr/registry.ts`) — don't hardcode a QR type list. `DashboardSidebar`'s nav items already match the real Module 1.2 route map.
- **Local Supabase via Docker works on this machine** — `supabase/config.toml` exists, ports `54321`–`54329`. `supabase start` on an existing volume does **not** auto-apply new migrations — use `supabase db reset` after adding one.
- RLS design intentionally leaves two gaps that are **not bugs**: `qr_codes` has no `anon` SELECT policy, `qr_scan_events` has no client-facing INSERT policy at all.
- On this machine, port 3000 is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 — check the actual port before assuming, and never stop a process on 3000 without confirming its PID belongs to this project first.
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
