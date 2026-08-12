# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 1 — Structure
- **Current module:** 1.5 — Supabase Auth, Storage, and RLS Design (not yet started)
- **Last completed module:** 1.4 — Supabase Database Architecture (COMPLETE)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -5` for the actual latest commit when resuming — as of writing, Modules 1.1–1.3 are committed and Module 1.4 is ready to commit.
- **Supabase integration status:** No live/hosted Supabase project yet, and none needed for Module 1.5 either (RLS policies and Storage bucket design are still local/documentation work). Migrations were validated against a **local, Docker-only** Supabase stack (`supabase start`) — not a real project. Live credentials aren't needed until Module 3.1.
- **Test status:** 41 unit tests passing (`npm run test`). `typecheck`, `lint`, `format:check`, and `build` all pass as of Module 1.3. Module 1.4's migrations were functionally validated against a local Postgres instance (inserts, constraint rejections, cascade/set-null deletes, and a full `supabase db reset` all confirmed correct) — see `docs/WORKLOG.md` Module 1.4 for the exact test list.

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
supabase start       # applies supabase/migrations/*.sql on first run
supabase db reset    # drops + recreates from migrations + seed.sql
supabase stop
```

## Current Blockers

None. All Module 1.1–1.4 work was completable locally without external input or live credentials.

## Next Exact Task

Start Module 1.5 (Supabase Auth, Storage, and RLS Design) — still no live Supabase connection needed:

1. Write the actual RLS policies for the 5 tables created in Module 1.4 (`profiles`, `qr_folders`, `qr_codes`, `qr_scan_events`, `qr_assets`) as a new migration under `supabase/migrations/` — owner-only select/insert/update/delete using `auth.uid()`, per the intent in master prompt §1.5 and §7. `qr_scan_events` needs a different policy shape since it's written by the server-side redirect route, not directly by the owning user — document that distinction.
2. Design (and migrate) Supabase Storage buckets: QR logos, PDFs/documents, image galleries, audio/video, profile avatars — prefer private buckets, document the signed-URL/server-delivery approach for private assets.
3. Define file type allowlists, size limits, and the user-isolated path convention (e.g. `{user_id}/{asset_id}/filename`) per bucket — as documentation now, enforced in code starting Module 3.8.
4. Document server vs. client Supabase client responsibilities (which operations must go through `server/actions`/`server/repositories` vs. what the browser client may do directly) in `docs/ARCHITECTURE.md`.
5. If Docker/local Supabase is still available, validate the new RLS policies the same way Module 1.4 validated the schema: create two test users locally, confirm user A cannot read/write user B's rows, confirm the anon role is fully blocked. This is still local-only — no live credentials needed.
6. Mark Module 1.5 complete in `docs/WORKLOG.md` once RLS is explicit, Storage policy is explicit, and cross-user access is confirmed denied.

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. The Next.js app lives at the repo root (not in a subfolder) — it was scaffolded into a temp `qr-code-generator/` dir (npm naming rejects capitalized dir names) and then moved up.
- Next.js version is 16.3.0, newer than most training data. Before writing framework-specific code, check `node_modules/next/dist/docs/` (bundled docs) — see `AGENTS.md` at the repo root, regenerated automatically by `next dev`. Key v16 gotchas are summarized in `docs/ARCHITECTURE.md` (async request APIs, `middleware.ts` → `proxy.ts` rename, removed `next lint`, etc.).
- Route params/searchParams are async in Next 16 — every dynamic page/route already follows `params: Promise<{...}>` + `await params`. Keep that pattern for new dynamic routes.
- If you add or move a top-level `page.tsx`, run `npx next typegen` (or `rm -rf .next` and rebuild) before `npm run typecheck` — stale generated route types otherwise fail with a misleading "Cannot find module" error.
- Zod is v4 (`^4.4.3`). The QR domain layer (`src/lib/qr`, `src/types/qr.ts`) is intentionally framework/UI-agnostic — see "QR Domain Model" in `docs/ARCHITECTURE.md` before extending it.
- **Local Supabase via Docker works on this machine** (Docker Desktop is installed and running) — `supabase init` already ran, `supabase/config.toml` exists, and the local stack uses ports `54321`–`54329` (no conflict with the unrelated `quran-lms-postgres` container that occupies host port `5432`). First `supabase start` on a machine will pull ~1–2GB of images; expect a transient DNS hiccup pulling from `public.ecr.aws` to be possible but not fatal — a retry reuses cached layers and is fast. The `supabase_vector` (analytics) container restart-looping on Windows is a known, harmless CLI limitation — ignore it.
- The `qr_codes.qr_type` check constraint in `supabase/migrations/20260813001214_create_qr_codes.sql` must stay in sync with the `QRType` union in `src/types/qr.ts` — if a type is ever added/removed from one, update the other.
- On this machine, port 3000 (Next.js dev server) is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 in that case — check the `npm run dev` output for the actual port, and never stop a process on 3000 without confirming it's actually this project's server first.
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
