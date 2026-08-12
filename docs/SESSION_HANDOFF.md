# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 2 — UI
- **Current module:** 2.5 — Authentication UI (not yet started)
- **Last completed module:** 2.4 — QR Generator UI (COMPLETE)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -16` for the actual latest commit when resuming — as of writing, Modules 1.1–2.3 are committed and Module 2.4 is ready to commit.
- **Supabase integration status:** No live/hosted Supabase project. Not needed for any of Phase 2. First live credential need is Module 3.1.
- **Test status:** 46 unit/component tests passing (41 payload-builder/registry + 5 new `QRGeneratorShell` interaction tests). `typecheck`, `lint` (0 errors), `format:check`, and a fresh production `build` (23 routes) all pass.

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

**This session's Browser pane cannot be trusted for interaction testing.** In Module 2.4, clicking type-selector/mode-toggle buttons produced no visible state change across `next dev` and `next start`, multiple fresh tabs, with zero console errors — extensive live debugging found no code-level cause (React fiber was attached to `<body>` but absent on every deeper node, including a component previously confirmed working in Module 2.2). This was resolved conclusively by writing a real component test (`tests/unit/components/QRGeneratorShell.test.tsx`, using `@testing-library/react` + `user-event` + `jsdom`) that exercises the same interactions through React's actual event system — all 5 passed, proving the app code was correct and the Browser pane itself was the unreliable part.

**Going forward:**

- **For interaction/behavior verification** (does clicking X change Y, does a form validate, does state reset correctly): write a Vitest + Testing Library component test under `tests/unit/components/`. This is now the established, reliable method — don't burn time re-litigating the Browser pane for this.
- **For content/structure/CSS verification** (does the right text render, does a breakpoint's computed style match, did a Tailwind utility compile correctly): the Browser pane's `textContent` and `getComputedStyle` remain trustworthy (established Module 2.3, reconfirmed Module 2.4's diagnostic session) — these don't depend on the same broken mechanism as click-driven interactivity.
- **For pixel geometry** (screenshots, `getBoundingClientRect`, `scrollHeight`, `offsetTop`): still unreliable — this pane does not composite frames in this session (Module 2.3 finding). Don't trust these.
- If a future session's Browser pane composites successfully (screenshots work) AND click-driven state changes are visible, both categories above may be trustworthy again — verify that first rather than assuming either way based on this note.
- `vitest.config.mts`'s test `include` pattern now covers both `**/*.test.ts` and `**/*.test.tsx` — if a new test file's count doesn't show up in the total after adding it, check this first (bit us once already).

## Next Exact Task

Start Module 2.5 (Authentication UI):

1. Build `/login`, `/signup`, `/forgot-password` pages (currently `RouteStub`s under `(auth)/`) with real forms: email/password fields, password visibility toggle, client-side validation (Zod + React Hook Form — same pattern as Module 2.4's content forms), loading state, error message area, links between the three pages.
2. Use a clean centered-card or split layout — a dedicated `(auth)/layout.tsx` (this group currently has no layout at all, unlike `(marketing)`).
3. No social auth buttons (master prompt explicitly: don't add fake/non-functional social login).
4. No actual submission logic yet — Module 3.1 wires real Supabase auth. Forms should validate and show their loading/error states via local component state standing in for what a real submit will eventually do (e.g. a disabled submit button that would call a not-yet-existing server action).
5. Verify via a component test (per the note above) for at least the login form's validation behavior, plus a browser content/structure check (not interaction) for visual sanity.
6. Document in `docs/ARCHITECTURE.md`, mark Module 2.5 complete in `docs/WORKLOG.md`, commit. Continue autonomously to Module 2.6 (Dashboard UI) afterward.

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. Next.js app at repo root (not a subfolder).
- Next.js 16.3.0 — check `node_modules/next/dist/docs/` before assuming v15-era behavior.
- **Tailwind v4** (`^4.3.3`), CSS-first `@theme` in `src/app/globals.css`. This project's `--radius-sm/md/lg` override Tailwind's own built-in radius scale of the same names — intentional, see "Design System" in `docs/ARCHITECTURE.md`.
- **Design system**: primary `#0F766E`. Use `Button`/`buttonVariants()`, `Card`, and the new `Input`/`Textarea`/`Select`/`FormField` primitives (`src/components/ui/`) rather than raw markup — Module 2.5's auth forms should reuse these directly.
- **Forms**: the established pattern (Module 2.4) is React Hook Form + `zodResolver` against a schema from `src/lib/validation/qr/` (or a new schema for auth — there's no login/signup Zod schema yet, add one under `src/lib/validation/` following the same shape) + the `FormField`/`Input` primitives for labels/errors.
- **lucide-react is v1.31.0** — a major-version package newer than most training data. Verify an icon export name exists (`node -e "console.log(typeof require('lucide-react').IconName)"`) before assuming it, same as Module 2.4 did for all 20 icon keys.
- **Marketing shell** (Module 2.2): `Header`/`Footer`/`Logo`/`MobileNavDrawer` under `src/components/layout/`, wired via `src/app/(marketing)/layout.tsx` — `(auth)` and `(dashboard)` do not get this shell, they need their own layouts (Module 2.5 adds `(auth)/layout.tsx`; Module 2.6 wires `DashboardSidebar`/`DashboardHeader`).
- **Component architecture** (Module 1.6): `QRTypeSelector`/`QRContentPanel` read from `qrTypeRegistry` (`src/lib/qr/registry.ts`) — don't hardcode a QR type list.
- **Local Supabase via Docker works on this machine** — `supabase/config.toml` exists, ports `54321`–`54329`. `supabase start` on an existing volume does **not** auto-apply new migrations — use `supabase db reset` after adding one.
- RLS design intentionally leaves two gaps that are **not bugs**: `qr_codes` has no `anon` SELECT policy, `qr_scan_events` has no client-facing INSERT policy at all.
- On this machine, port 3000 is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 — check the actual port before assuming, and never stop a process on 3000 without confirming its PID belongs to this project first.
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
