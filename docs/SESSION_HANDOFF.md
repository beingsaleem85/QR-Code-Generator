# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 2 — UI
- **Current module:** 2.2 — Public Header, Footer, and Marketing Shell (not yet started)
- **Last completed module:** 2.1 — Visual Design System (COMPLETE)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -10` for the actual latest commit when resuming — as of writing, Modules 1.1–1.7 are committed and Module 2.1 is ready to commit.
- **Supabase integration status:** No live/hosted Supabase project. Not needed for any of Phase 2 (UI uses mock/local data). First live credential need is Module 3.1.
- **Test status:** 41 unit tests passing. `typecheck`, `lint`, `format:check`, `test`, and a fresh production `build` all pass. Design tokens verified two ways: directly in compiled CSS output, and live in a running production server + browser session (computed styles matched intended values exactly).

## Relevant Commands

```bash
npm install
npm run dev         # http://localhost:3000
npm run build
npm run start        # production server, for realistic verification
npm run typecheck
npm run lint
npm run format:check
npm run test

# Local Supabase (Docker required, fully offline, no account needed):
supabase start       # reuses existing DB volume; does NOT auto-apply new migrations
supabase db reset    # drops + recreates from supabase/migrations/*.sql + seed.sql
supabase stop
```

## Current Blockers

None.

## Next Exact Task

Start Module 2.2 (Public Header, Footer, and Marketing Shell):

1. Build a real header: original logo/wordmark placeholder (not QR.io's), nav links (QR Codes/Generator, Static QR, Dynamic QR, Features, optional Pricing, Login), a prominent "Create QR Code"/"Sign Up" CTA. Desktop: horizontal nav. Mobile: accessible drawer (keyboard-operable, focus-trapped, closes on Escape).
2. Build a real footer: grouped links (Product, QR Types, Resources/Help, Company/Legal), copyright, privacy/terms links (can point to the not-yet-written `/privacy`/`/terms` placeholders — legal content itself is Module 3.15). No fake language switcher unless multilingual support is actually implemented.
3. Use the Module 2.1 design tokens (`bg-primary`, `text-foreground`, etc.) and the `Button` primitive for the CTA — this is the first real per-page visual pass, building on the proof points from 2.1.
4. Wire the header/footer into the root layout (`src/app/layout.tsx`) or a `(marketing)` group layout so they wrap every marketing page consistently — decide which based on whether `(auth)`/`(dashboard)` should also get them (master prompt implies marketing-only, so likely a `(marketing)/layout.tsx`, not the root layout).
5. Verify: all visible links point to a valid route from the Module 1.2 route map or an intentionally marked placeholder; mobile nav is keyboard-accessible; responsive at mobile/desktop widths — verify live in a browser (dev or prod server), not just by reading the JSX.
6. Document in `docs/ARCHITECTURE.md`, mark Module 2.2 complete in `docs/WORKLOG.md`, commit.

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. The Next.js app lives at the repo root — it was scaffolded into a temp `qr-code-generator/` dir (npm naming rejects capitalized dir names) and then moved up.
- Next.js version is 16.3.0, newer than most training data — check `node_modules/next/dist/docs/` before assuming v15-era behavior. Key v16 gotchas are summarized in `docs/ARCHITECTURE.md`.
- **Tailwind is v4** (`^4.3.3`), CSS-first `@theme` config in `src/app/globals.css`, not a `tailwind.config.js` theme object. **This project's `--radius-sm/md/lg` tokens override Tailwind v4's own built-in radius scale of the same names** — confirmed by inspecting compiled CSS. Don't be surprised that `rounded-lg` resolves to 12px, not v4's own default; that's intentional (see "Design System" in `docs/ARCHITECTURE.md`).
- **Design system** (Module 2.1): primary color is `#0F766E` (deep teal) — use `bg-primary`/`text-primary-foreground`/`hover:bg-primary-hover` etc., not hardcoded hex or `gray-*`/`blue-*` Tailwind colors. Use the `Button` (`src/components/ui/Button.tsx`) and `Card` (`src/components/ui/Card.tsx`) primitives rather than raw `<button>`/`<div>` markup for anything button- or card-shaped. Check contrast math before introducing a new color token — see the WCAG numbers already recorded in `docs/ARCHITECTURE.md` as the pattern to follow.
- Route params/searchParams are async in Next 16 — every dynamic page/route already follows `params: Promise<{...}>` + `await params`.
- If you add or move a top-level `page.tsx`, run `npx next typegen` (or `rm -rf .next` and rebuild) before `npm run typecheck`.
- **Component architecture** (Module 1.6): `QRTypeSelector`/`QRContentPanel` read from `qrTypeRegistry` (`src/lib/qr/registry.ts`) — don't hardcode a QR type list. `QRGeneratorShell` owns all generator state locally (no global store).
- **Local Supabase via Docker works on this machine** — `supabase/config.toml` exists, ports `54321`–`54329`. `supabase start` on an existing volume does **not** auto-apply new migrations — use `supabase db reset` after adding one.
- RLS design intentionally leaves two gaps that are **not bugs**: `qr_codes` has no `anon` SELECT policy, `qr_scan_events` has no client-facing INSERT policy at all — both filled by a privileged server-side path in Module 3.6/3.7.
- On this machine, port 3000 is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 — check the actual port in the command output, and never stop a process on 3000 without confirming its PID belongs to this project first.
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
