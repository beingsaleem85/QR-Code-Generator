# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 1 — Structure
- **Current module:** 1.7 — Structure Phase Verification (not yet started) — the last module before Phase 2 (UI) begins
- **Last completed module:** 1.6 — Structural Component Architecture (COMPLETE)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -5` for the actual latest commit when resuming — as of writing, Modules 1.1–1.5 are committed and Module 1.6 is ready to commit.
- **Supabase integration status:** No live/hosted Supabase project yet. RLS policies and Storage buckets exist as migrations, validated against a **local, Docker-only** Supabase stack. Live credentials aren't needed until Module 3.1.
- **Test status:** 41 unit tests passing (`npm run test`). `typecheck`, `lint`, `format:check`, and `build` all pass. The `/qr-generator` page (real `QRGeneratorShell` composition) was manually verified in a live browser session — mode/type filtering, content-panel sync, and name-field input all confirmed working with zero console errors.

## Relevant Commands

```bash
npm install
npm run dev         # http://localhost:3000
npm run build
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

None. All Module 1.1–1.6 work was completable locally without external input or live credentials.

## Next Exact Task

Run Module 1.7 (Structure Phase Verification) — this is the **Phase 1 exit gate**; do not start Phase 2 (UI, Module 2.1+) until it passes:

1. Run the full check suite fresh: `npm install`, `npm run dev` (smoke test, then stop it), `npm run build` (production), `npm run typecheck`, `npm run lint`, `npm run test`, and a migration/schema validation pass (`supabase db reset` against the local Docker stack, same as Modules 1.4/1.5).
2. Do a route smoke test across all 21 routes (already done piecemeal in Module 1.2 — re-verify in one pass now that Module 1.6 changed `/qr-generator`).
3. Write a **Structure Phase Completion Report** (a new section in `docs/WORKLOG.md` or a dedicated summary) covering: architecture summary, route map, data model summary, security model summary, known blockers, and credential requirements for Phase 2/3 (there should be none yet — Supabase credentials aren't needed until Module 3.1).
4. Only after this passes, start Phase 2 — Module 2.1 (Visual Design System). Phase 2 is explicitly about polished interfaces using mock/local data; don't prematurely implement full feature behavior (that's Phase 3).

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. The Next.js app lives at the repo root (not in a subfolder) — it was scaffolded into a temp `qr-code-generator/` dir (npm naming rejects capitalized dir names) and then moved up.
- Next.js version is 16.3.0, newer than most training data. Before writing framework-specific code, check `node_modules/next/dist/docs/` (bundled docs) — see `AGENTS.md` at the repo root, regenerated automatically by `next dev`. Key v16 gotchas are summarized in `docs/ARCHITECTURE.md` (async request APIs, `middleware.ts` → `proxy.ts` rename, removed `next lint`, etc.).
- Route params/searchParams are async in Next 16 — every dynamic page/route already follows `params: Promise<{...}>` + `await params`. Keep that pattern for new dynamic routes.
- If you add or move a top-level `page.tsx`, run `npx next typegen` (or `rm -rf .next` and rebuild) before `npm run typecheck` — stale generated route types otherwise fail with a misleading "Cannot find module" error.
- Zod is v4 (`^4.4.3`). The QR domain layer (`src/lib/qr`, `src/types/qr.ts`) is intentionally framework/UI-agnostic — see "QR Domain Model" in `docs/ARCHITECTURE.md`.
- **Component architecture** (Module 1.6): `QRTypeSelector`/`QRContentPanel` read from `qrTypeRegistry` — don't hardcode a QR type list anywhere. `QRGeneratorShell` owns all generator state locally; keep following that pattern (no global store) unless cross-panel coordination genuinely can't be done any other way. All current components render through the shared `src/components/ui/Placeholder.tsx` — Phase 2 replaces each usage with real styled content, component by component, not all at once.
- **Local Supabase via Docker works on this machine** (Docker Desktop is installed and running) — `supabase/config.toml` exists, the local stack uses ports `54321`–`54329` (no conflict with the unrelated `quran-lms-postgres` container on host port `5432`). Important: `supabase start` on an **existing** Docker volume does **not** auto-apply newly added migration files — run `supabase db reset` after adding a migration. First-time image pulls total ~1–2GB; a transient DNS hiccup pulling from `public.ecr.aws` is possible but not fatal.
- RLS design intentionally leaves two gaps that are **not bugs**: `qr_codes` has no `anon` SELECT policy, and `qr_scan_events` has no client-facing INSERT policy at all — both filled by a privileged server-side path in Module 3.6/3.7. See "Auth, Storage, and RLS" in `docs/ARCHITECTURE.md`.
- On this machine, port 3000 (Next.js dev server) is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 in that case — check the `npm run dev` output for the actual port, and never stop a process on 3000 without confirming it's actually this project's server first.
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
