# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 2 — UI (Phase 1 Structure is COMPLETE and gate-verified)
- **Current module:** 2.1 — Visual Design System (not yet started)
- **Last completed module:** 1.7 — Structure Phase Verification (COMPLETE, phase gate passed)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -8` for the actual latest commit when resuming — as of writing, Modules 1.1–1.6 are committed and Module 1.7 (verification-only, no new app code) is ready to commit.
- **Supabase integration status:** No live/hosted Supabase project. Not needed for Phase 2 at all (UI uses mock/local data per its charter). Schema + RLS + Storage exist as migrations, twice validated end-to-end against a local Docker-only stack (Modules 1.4/1.5, re-confirmed in 1.7). First live credential need is Module 3.1.
- **Test status:** 41 unit tests passing. `typecheck`, `lint`, `format:check`, `test`, and a **fresh** (`npm ci` + `rm -rf .next`) production `build` all pass. Full 21-route smoke test against the **production server** (`next start`, not `dev`) passed. See `docs/WORKLOG.md` Module 1.7 for the complete Structure Phase Completion Report.

## Relevant Commands

```bash
npm install
npm run dev         # http://localhost:3000
npm run build
npm run start        # production server, for realistic smoke testing
npm run typecheck
npm run lint
npm run format:check
npm run test

# Local Supabase (Docker required, fully offline, no account needed):
supabase start       # reuses existing DB volume; does NOT auto-apply new migrations
supabase db reset    # drops + recreates from supabase/migrations/*.sql + seed.sql — use this after adding a migration
supabase stop
```

## Current Blockers

None. All of Phase 1 was completable locally without external input or live credentials, and Phase 2 doesn't need them either.

## Next Exact Task

Start Module 2.1 (Visual Design System) — Phase 2 (UI): implement polished interfaces using mock/local data, do not prematurely implement full feature behavior (that's Phase 3).

1. Define design tokens (background, surface, foreground, muted-foreground, border, primary, primary-foreground, destructive, success, warning, focus-ring) — likely as Tailwind theme extensions / CSS variables in `src/app/globals.css` or a `tailwind.config` equivalent (Tailwind 4 uses CSS-first config via `@theme` in `globals.css` — check `node_modules/next/dist/docs` / Tailwind 4 docs if unfamiliar, since this postdates most training data too).
2. Define spacing scale, typography scale, border radii, control heights, card styles, shadows, transitions — centralized, not ad hoc per component.
3. Establish an original visual identity — modern SaaS, clean, spacious, trustworthy — per master prompt §2.1. Do NOT clone QR.io branding.
4. Verify accessibility basics: keyboard navigable, visible focus states, proper labels, semantic buttons, color not the sole status indicator, `prefers-reduced-motion` respected.
5. Apply the new tokens to a few existing structural components (e.g. `Placeholder`, the generator shell) as a proof the system works, without yet doing a full visual pass across every page (later UI modules do that page-by-page).
6. Document the token system in `docs/ARCHITECTURE.md` (new "Design System" section), mark Module 2.1 complete in `docs/WORKLOG.md`.
7. Continue in strict order through Module 2.2 (Header/Footer/Marketing Shell) → 2.10 (Responsive/Accessibility Audit) before Phase 3 begins.

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. The Next.js app lives at the repo root (not in a subfolder) — it was scaffolded into a temp `qr-code-generator/` dir (npm naming rejects capitalized dir names) and then moved up.
- Next.js version is 16.3.0, newer than most training data. Before writing framework-specific code, check `node_modules/next/dist/docs/` (bundled docs) — see `AGENTS.md` at the repo root, regenerated automatically by `next dev`. Key v16 gotchas are summarized in `docs/ARCHITECTURE.md` (async request APIs, `middleware.ts` → `proxy.ts` rename, removed `next lint`, etc.).
- **Tailwind is v4** (`^4`), which uses CSS-first `@theme` configuration in `globals.css` instead of a `tailwind.config.js` theme object — this is also newer than most training data. Check current `src/app/globals.css` and the installed `tailwindcss` package's docs/changelog before assuming v3-style config.
- Route params/searchParams are async in Next 16 — every dynamic page/route already follows `params: Promise<{...}>` + `await params`. Keep that pattern for new dynamic routes.
- If you add or move a top-level `page.tsx`, run `npx next typegen` (or `rm -rf .next` and rebuild) before `npm run typecheck` — stale generated route types otherwise fail with a misleading "Cannot find module" error.
- **Component architecture** (Module 1.6): `QRTypeSelector`/`QRContentPanel` read from `qrTypeRegistry` (`src/lib/qr/registry.ts`) — don't hardcode a QR type list anywhere. `QRGeneratorShell` owns all generator state locally; keep following that pattern (no global store) unless cross-panel coordination genuinely can't be done any other way. All current components render through `src/components/ui/Placeholder.tsx` — Phase 2's job is replacing each usage with real styled content, component by component.
- **Local Supabase via Docker works on this machine** (Docker Desktop is installed and running) — `supabase/config.toml` exists, ports `54321`–`54329` (no conflict with the unrelated `quran-lms-postgres` container on host port `5432`). `supabase start` on an **existing** volume does **not** auto-apply new migrations — use `supabase db reset` after adding one.
- RLS design intentionally leaves two gaps that are **not bugs**: `qr_codes` has no `anon` SELECT policy, `qr_scan_events` has no client-facing INSERT policy at all — both filled by a privileged server-side path in Module 3.6/3.7. See "Auth, Storage, and RLS" in `docs/ARCHITECTURE.md`.
- On this machine, port 3000 is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 in that case — check the `npm run dev`/`npm run start` output for the actual port, and never stop a process on 3000 without confirming it's actually this project's server first.
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
