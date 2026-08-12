# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 2 — UI
- **Current module:** 2.4 — QR Generator UI (not yet started) — **the most important screen in the product**, per the master build prompt
- **Last completed module:** 2.3 — Home Page UI (COMPLETE)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -14` for the actual latest commit when resuming — as of writing, Modules 1.1–2.2 are committed and Module 2.3 is ready to commit.
- **Supabase integration status:** No live/hosted Supabase project. Not needed for any of Phase 2. First live credential need is Module 3.1.
- **Test status:** 41 unit tests passing. `typecheck`, `lint`, `format:check`, `test`, and a fresh production `build` (23 routes) all pass.

## Relevant Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run start         # production server, for realistic verification
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

## ⚠️ Important environment note before doing any more browser verification

**This session's Browser pane does not composite frames.** `computer.screenshot` fails outright, and layout-dependent geometry (`getBoundingClientRect`, `offsetTop`, `scrollHeight`, `innerText`) all return degenerate/zero values (confirmed: a real footer reported `offsetTop: 0`). Do **not** trust those APIs for verification in this session — they'll silently "pass" checks (e.g. "no overflow") regardless of whether a real bug exists, because they collapse to viewport size instead of actual layout.

What **is** reliable, confirmed across Modules 2.1–2.3:

- `getComputedStyle(...).property` for anything CSS-cascade-resolved (colors, `display`, resolved custom properties) — this doesn't need a layout pass.
- **Breakpoint matching**: compare a computed style (padding, font-size, flex-direction, display) at two different `resize_window` presets. A `sm:`/`md:`/`lg:` media query either matches or it doesn't, independent of box geometry. This is how responsive behavior was verified in Module 2.3.
- `document.querySelector(...).textContent` (NOT `innerText`) for content/structure checks.
- `.click()` via `javascript_tool` + checking `window.location.pathname` afterward for navigation/interaction — the `computer` tool's own click/key simulation is unreliable here too (confirmed in Module 2.2: a `computer` click silently failed to register while the equivalent `javascript_tool` `.click()` worked). Re-check state on a _later_ call, not synchronously in the same script, since React doesn't always flush synchronously after a script-dispatched event.
- Reading compiled CSS output directly (`.next/static/chunks/*.css`) to confirm a Tailwind utility/variant actually generated the rule you expect — used successfully for `open:`/`backdrop:` (Module 2.2) and opacity-modifier utilities (Module 2.3).

If a future session's Browser pane _does_ composite (screenshots succeed), pixel-level checks become trustworthy again — just verify that first rather than assuming either way.

## Next Exact Task

Start Module 2.4 (QR Generator UI) — the master build prompt calls this "the most important product screen":

1. Take the Module 1.6 `QRGeneratorShell` (currently a Structure-phase skeleton — `QRContentPanel` just shows a label, `QRDesignPanel`'s 5 sub-panels are `Placeholder`s, `QRPreviewPanel` is a placeholder box) and give it the real Module 2.1 visual treatment: the desktop layout from §2.4 (content+design on the left, sticky preview+actions on the right), an accordion or tabbed structure for the 5 design sections (not 30 controls in one flat list), and a mobile layout that stacks content-first with an easy-to-reach primary action.
2. This is UI polish only — **do not** wire real per-type form fields, real QR rendering, or persistence yet (that's Module 3.2/3.3/3.5). The content panel can still say "implemented in Module 2.4... [design]" but should now look like a real form area, not a dashed placeholder box.
3. Add loading/error/empty-state visuals for the pieces that need them per §9, even though nothing is wired to real data yet — at minimum, what an empty/default preview state looks like.
4. Verify at mobile + desktop widths using the breakpoint-matching technique above (not pixel geometry). Confirm no keyboard traps, visible focus states throughout (should already come from the global `:focus-visible` rule, but verify on the new interactive elements specifically), and zero console errors.
5. Document in `docs/ARCHITECTURE.md`, mark Module 2.4 complete in `docs/WORKLOG.md`, commit. Continue autonomously to Module 2.5 (Authentication UI) afterward, per standing instruction.

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. Next.js app at repo root (not a subfolder).
- Next.js 16.3.0 — check `node_modules/next/dist/docs/` before assuming v15-era behavior.
- **Tailwind v4** (`^4.3.3`), CSS-first `@theme` in `src/app/globals.css`. This project's `--radius-sm/md/lg` override Tailwind's own built-in radius scale of the same names — intentional, see "Design System" in `docs/ARCHITECTURE.md`.
- **Design system**: primary `#0F766E` via `bg-primary`/`text-primary-foreground`/etc. Use `Button`/`buttonVariants()` (`src/components/ui/Button.tsx`) and `Card` (`src/components/ui/Card.tsx`) rather than raw markup.
- **Marketing shell** (Module 2.2): `Header`/`Footer`/`Logo`/`MobileNavDrawer` under `src/components/layout/`, wired via `src/app/(marketing)/layout.tsx`. Brand placeholder is "QRForge."
- **Homepage** (Module 2.3): `src/components/marketing/*`, composed in `(marketing)/page.tsx`. `QrTypeGrid` reads the live registry — keep that pattern anywhere else a type list appears.
- **Component architecture** (Module 1.6): `QRTypeSelector`/`QRContentPanel` read from `qrTypeRegistry` (`src/lib/qr/registry.ts`) — don't hardcode a QR type list. `QRGeneratorShell` owns all generator state locally (no global store) — Module 2.4 restyles this shell, it doesn't replace its state model.
- **Local Supabase via Docker works on this machine** — `supabase/config.toml` exists, ports `54321`–`54329`. `supabase start` on an existing volume does **not** auto-apply new migrations — use `supabase db reset` after adding one.
- RLS design intentionally leaves two gaps that are **not bugs**: `qr_codes` has no `anon` SELECT policy, `qr_scan_events` has no client-facing INSERT policy at all.
- On this machine, port 3000 is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 — check the actual port before assuming, and never stop a process on 3000 without confirming its PID belongs to this project first.
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
