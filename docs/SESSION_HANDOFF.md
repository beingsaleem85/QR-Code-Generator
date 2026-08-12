# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 1 — Structure
- **Current module:** 1.6 — Structural Component Architecture (not yet started)
- **Last completed module:** 1.5 — Supabase Auth, Storage, and RLS Design (COMPLETE)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -5` for the actual latest commit when resuming — as of writing, Modules 1.1–1.4 are committed and Module 1.5 is ready to commit.
- **Supabase integration status:** No live/hosted Supabase project yet, still not needed for Module 1.6 (component skeletons) either. RLS policies and Storage buckets exist as migrations and were validated against a **local, Docker-only** Supabase stack — cross-user access denial and anon lockout both confirmed at the database level. Live credentials aren't needed until Module 3.1.
- **Test status:** 41 unit tests passing (`npm run test`). `typecheck`, `lint`, `format:check`, and `build` all pass. Module 1.4/1.5's migrations were functionally validated against a local Postgres instance (schema, constraints, cascades, RLS cross-user isolation, Storage policies) — see `docs/WORKLOG.md` for the exact test list.

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

None. All Module 1.1–1.5 work was completable locally without external input or live credentials.

## Next Exact Task

Start Module 1.6 (Structural Component Architecture) — component _skeletons_ only, no final visual styling (that's Phase 2):

1. Build skeleton components for the QR generator shell: `QRGeneratorShell`, `QRTypeSelector`, `QRContentPanel`, `QRDesignPanel`, `QRPreviewPanel`, `QRDownloadActions`, `QRNameField`, `QRModeToggle` under `src/components/qr/`.
2. Build skeleton design-control components: `DesignFrameControls`, `DesignPatternControls`, `DesignEyeControls`, `DesignColorControls`, `DesignLogoControls` under `src/components/qr/`.
3. Build skeleton dashboard components: `DashboardSidebar`, `DashboardHeader`, `QRCodeCard`, `QRCodeTable`, `QRCodeStatusBadge`, `EmptyState` under `src/components/dashboard/`.
4. Build skeleton analytics components: `AnalyticsSummaryCards`, `AnalyticsChartShell`, `AnalyticsFilters` under `src/components/analytics/`.
5. Decide and document form architecture: QR type → content form schema mapping (uses the Module 1.3 registry), form state vs. persisted state separation, design state reusability across types, debounced preview updates (uses `previewUpdateStrategy` from the registry).
6. Document the state-ownership rule already drafted in `docs/ARCHITECTURE.md` — confirm/extend it against the actual component list above; add a small dedicated builder store only if cross-panel coordination genuinely requires it (content + design + preview needing to react to each other).
7. Wire the generator shell to structurally render (composing the skeleton components) without full styling or backend behavior.
8. Mark Module 1.6 complete in `docs/WORKLOG.md`, then run Module 1.7 (Structure Phase Verification) — full check suite plus a **Structure Phase Completion Report** — before starting Phase 2 (UI).

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. The Next.js app lives at the repo root (not in a subfolder) — it was scaffolded into a temp `qr-code-generator/` dir (npm naming rejects capitalized dir names) and then moved up.
- Next.js version is 16.3.0, newer than most training data. Before writing framework-specific code, check `node_modules/next/dist/docs/` (bundled docs) — see `AGENTS.md` at the repo root, regenerated automatically by `next dev`. Key v16 gotchas are summarized in `docs/ARCHITECTURE.md` (async request APIs, `middleware.ts` → `proxy.ts` rename, removed `next lint`, etc.).
- Route params/searchParams are async in Next 16 — every dynamic page/route already follows `params: Promise<{...}>` + `await params`. Keep that pattern for new dynamic routes.
- If you add or move a top-level `page.tsx`, run `npx next typegen` (or `rm -rf .next` and rebuild) before `npm run typecheck` — stale generated route types otherwise fail with a misleading "Cannot find module" error.
- Zod is v4 (`^4.4.3`). The QR domain layer (`src/lib/qr`, `src/types/qr.ts`) is intentionally framework/UI-agnostic — see "QR Domain Model" in `docs/ARCHITECTURE.md` before extending it. When building the Module 1.6 QR generator components, drive the type selector and content form from `qrTypeRegistry`/`getQrTypeDefinition` (`src/lib/qr/registry.ts`) rather than hardcoding a type list.
- **Local Supabase via Docker works on this machine** (Docker Desktop is installed and running) — `supabase/config.toml` exists, the local stack uses ports `54321`–`54329` (no conflict with the unrelated `quran-lms-postgres` container on host port `5432`). Important: `supabase start` on an **existing** Docker volume does **not** auto-apply newly added migration files — run `supabase db reset` after adding a migration, or `supabase start` will silently leave your new tables/policies missing. First-time image pulls total ~1–2GB; a transient DNS hiccup pulling from `public.ecr.aws` is possible but not fatal — a retry reuses cached layers. The `supabase_vector` (analytics) container restart-looping on Windows is a known, harmless CLI limitation.
- The `qr_codes.qr_type` check constraint in `supabase/migrations/20260813001214_create_qr_codes.sql` must stay in sync with the `QRType` union in `src/types/qr.ts` — if a type is ever added/removed from one, update the other.
- RLS design intentionally leaves two gaps that are **not bugs**: `qr_codes` has no `anon` SELECT policy, and `qr_scan_events` has no client-facing INSERT policy at all. Both are meant to be filled by a privileged server-side path (service-role key or a `SECURITY DEFINER` RPC) in Module 3.6/3.7 — see "Auth, Storage, and RLS" in `docs/ARCHITECTURE.md` before touching either table's policies.
- On this machine, port 3000 (Next.js dev server) is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 in that case — check the `npm run dev` output for the actual port, and never stop a process on 3000 without confirming it's actually this project's server first.
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
