# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 2 — UI
- **Current module:** 2.3 — Home Page UI (not yet started)
- **Last completed module:** 2.2 — Public Header, Footer, and Marketing Shell (COMPLETE)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -12` for the actual latest commit when resuming — as of writing, Modules 1.1–2.1 are committed and Module 2.2 is ready to commit.
- **Supabase integration status:** No live/hosted Supabase project. Not needed for any of Phase 2. First live credential need is Module 3.1.
- **Test status:** 41 unit tests passing. `typecheck`, `lint`, `format:check`, `test`, and a fresh production `build` (23 routes) all pass. Header/footer/mobile-drawer behavior verified live in a browser at both 1280px and 375px — see `docs/WORKLOG.md` Module 2.2 for the full list of what was actually exercised (not just read from source).

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

## Next Exact Task

Start Module 2.3 (Home Page UI) — a strong landing page making QR generation the primary action, per master prompt §2.3:

1. Build out `src/app/(marketing)/page.tsx` (currently a bare `RouteStub`) with the recommended structure: Hero → generator preview/entry → trust/benefit strip → Static vs Dynamic explanation → feature cards → QR type grid → How it works → use cases → analytics/customization preview → FAQ teaser → CTA. Not every section needs to be built with full depth in one pass — prioritize hero + generator entry + a few sections, matching "polished but not overbuilt" Phase 2 scope.
2. Original hero copy — do not reuse the master prompt's example headline verbatim if a better original version is written; keep the spirit (clear value prop, "create QR codes" CTA, secondary "Explore QR Types" link).
3. Use Module 2.1 tokens/primitives (`Button`, `Card`) throughout — this is the first full page-level visual pass, not another "proof point."
4. Verify: clear first-screen action, good mobile hierarchy, no overly tall empty hero, value understandable in a few seconds. Verify live in a browser at mobile + desktop widths (established pattern from Module 2.2 — `computer` tool's click/key simulation is unreliable in this headless session, use `javascript_tool` for interaction checks).
5. Document in `docs/ARCHITECTURE.md`, mark Module 2.3 complete in `docs/WORKLOG.md`, commit. Then continue to Module 2.4 (QR Generator UI — the most important screen) without pausing, per standing instruction to proceed autonomously through the UI modules.

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. Next.js app at repo root (not a subfolder).
- Next.js 16.3.0 — check `node_modules/next/dist/docs/` before assuming v15-era behavior. Key gotchas in `docs/ARCHITECTURE.md`.
- **Tailwind v4** (`^4.3.3`), CSS-first `@theme` in `src/app/globals.css`. This project's `--radius-sm/md/lg` override Tailwind's own built-in radius scale of the same names — intentional, see "Design System" in `docs/ARCHITECTURE.md`.
- **Design system**: primary `#0F766E` via `bg-primary`/`text-primary-foreground`/etc. Use `Button` (`src/components/ui/Button.tsx`, also exports `buttonVariants()` for link-styled CTAs) and `Card` (`src/components/ui/Card.tsx`) rather than raw markup.
- **Marketing shell** (Module 2.2): `Header`/`Footer`/`Logo`/`MobileNavDrawer` under `src/components/layout/`, wired via `src/app/(marketing)/layout.tsx`. Don't duplicate header/footer markup on individual marketing pages — they're already wrapped.
- **Browser automation note**: in this headless session, the `computer` tool's click/key simulation doesn't reliably reach the page ("Browser pane is not displayed" errors on click/screenshot). Use `javascript_tool` (`document.querySelector(...).click()`, `getComputedStyle(...)`, etc.) for interaction and visual-state verification instead — confirmed reliable across Modules 2.1 and 2.2. Re-check `dialog.open`/`aria-*` attributes after a `computer.wait` or on a later `javascript_tool` call if checking immediately after a script-dispatched click, since React state updates aren't always flushed synchronously.
- **Component architecture** (Module 1.6): `QRTypeSelector`/`QRContentPanel` read from `qrTypeRegistry` (`src/lib/qr/registry.ts`) — don't hardcode a QR type list. `QRGeneratorShell` owns all generator state locally (no global store).
- **Local Supabase via Docker works on this machine** — `supabase/config.toml` exists, ports `54321`–`54329`. `supabase start` on an existing volume does **not** auto-apply new migrations — use `supabase db reset` after adding one.
- RLS design intentionally leaves two gaps that are **not bugs**: `qr_codes` has no `anon` SELECT policy, `qr_scan_events` has no client-facing INSERT policy at all — both filled by a privileged server-side path in Module 3.6/3.7.
- On this machine, port 3000 is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 — check the actual port in the command output before assuming, and never stop a process on 3000 without confirming its PID belongs to this project first.
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
