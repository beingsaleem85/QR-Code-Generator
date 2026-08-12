# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 1 — Structure
- **Current module:** 1.4 — Supabase Database Architecture (not yet started)
- **Last completed module:** 1.3 — QR Domain Model and Type System (COMPLETE)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -5` for the actual latest commit when resuming — as of writing, Modules 1.1 and 1.2 are committed and Module 1.3 is ready to commit.
- **Supabase integration status:** Not started. No credentials requested yet. Module 1.4 is schema/RLS _design_ only and does not require live Supabase credentials — those aren't needed until Module 3.1.
- **Test status:** 41 unit tests passing (`npm run test`) covering the QR payload builders and type registry. `typecheck`, `lint`, `format:check`, and `build` all pass as of Module 1.3.

## Relevant Commands

```bash
npm install
npm run dev         # http://localhost:3000
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run test
```

## Current Blockers

None. All Module 1.1–1.3 work was completable locally without external input.

## Next Exact Task

Start Module 1.4 (Supabase Database Architecture) — schema design only, no live Supabase connection needed:

1. Write SQL migrations under `supabase/migrations/` for `profiles`, `qr_codes`, `qr_scan_events`, `qr_assets`, and `qr_folders` (+ join table or `folder_id`), following the field lists in the master build prompt §1.4.
2. Define foreign keys, indexes (`qr_codes.user_id`, `qr_codes.slug`, `qr_codes.created_at`, `qr_scan_events.qr_code_id`, `qr_scan_events.scanned_at`), and a deliberate delete-behavior choice per table.
3. Document the privacy handling for `qr_scan_events` (no raw IP by default, privacy-minimized fields) and the fact that `payload_data`/`design_config` are versionable JSONB, not secrets.
4. Document the schema in `docs/ARCHITECTURE.md` under "Database Schema"; mark Module 1.4 complete in `docs/WORKLOG.md`.
5. Do NOT request Supabase credentials for this module — it's schema design, not a live connection. Credentials come up in Module 1.5 (RLS/Storage design, still no live connection needed) at the earliest, and realistically Module 3.1.

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. The Next.js app lives at the repo root (not in a subfolder) — it was scaffolded into a temp `qr-code-generator/` dir (npm naming rejects capitalized dir names) and then moved up.
- Next.js version is 16.3.0, newer than most training data. Before writing framework-specific code, check `node_modules/next/dist/docs/` (bundled docs) — see `AGENTS.md` at the repo root, regenerated automatically by `next dev`. Key v16 gotchas are summarized in `docs/ARCHITECTURE.md` (async request APIs, `middleware.ts` → `proxy.ts` rename, removed `next lint`, etc.).
- Route params/searchParams are async in Next 16 — every dynamic page/route already follows `params: Promise<{...}>` + `await params`. Keep that pattern for new dynamic routes.
- If you add or move a top-level `page.tsx`, run `npx next typegen` (or `rm -rf .next` and rebuild) before `npm run typecheck` — stale generated route types otherwise fail with a misleading "Cannot find module" error.
- Zod is v4 (`^4.4.3`) — both `z.string().email()`/`.url()` and the newer top-level `z.email()`/`z.url()` work; this codebase uses the `.string()...` chained form for consistency across schemas in `src/lib/validation/qr/`.
- The QR domain layer (`src/lib/qr`, `src/types/qr.ts`) is intentionally framework/UI-agnostic — don't import React, Next.js, or a QR rendering library from it. See "QR Domain Model" in `docs/ARCHITECTURE.md` before extending the registry or adding a payload builder.
- On this machine, port 3000 is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 in that case — check the `npm run dev` output for the actual port, and never stop a process on 3000 without confirming it's actually this project's server first (`Get-NetTCPConnection -LocalPort 3000` → match the PID before killing it).
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
