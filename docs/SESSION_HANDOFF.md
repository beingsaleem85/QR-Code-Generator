# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 1 — Structure
- **Current module:** 1.3 — QR Domain Model and Type System (not yet started)
- **Last completed module:** 1.2 — Route and Information Architecture (COMPLETE)
- **Branch/commit:** local git repo (`master`). Module 1.1 committed as `844dfe1` ("chore: establish qr platform foundation"). Module 1.2 committed as a follow-up — check `git log --oneline -5` when resuming for the actual latest commit.
- **Supabase integration status:** Not started. No credentials requested yet — not needed until Module 3.1 (or Module 1.4/1.5 for schema/RLS design, which does not require live credentials).
- **Test status:** No automated tests written yet (none required until QR payload builders exist starting in Module 1.3). `typecheck`, `lint`, `format:check`, and `build` all pass as of Module 1.2.

## Relevant Commands

```bash
npm install
npm run dev         # http://localhost:3000
npm run build
npm run typecheck
npm run lint
npm run format:check
```

## Current Blockers

None. All Module 1.1–1.2 work was completable locally without external input.

## Next Exact Task

Start Module 1.3 (QR Domain Model and Type System):

1. Define the `QRMode` and `QRType` union types under `src/types/`.
2. Build a QR type registry (`src/lib/qr/`) — one config object per type declaring key, label, icon, static/dynamic support, field schema, payload builder, storage/landing-page/analytics needs, per the master prompt's Module 1.3 spec.
3. Write typed, unit-testable payload builder functions per format (URL, text, `mailto:`, `tel:`, `sms:`, WhatsApp, Wi-Fi, vCard/MECARD, event) — payload generation only, no QR rendering/canvas code in this module.
4. Add field validation contracts (Zod schemas under `src/lib/validation/`).
5. Add unit tests for the payload builders under `tests/unit/`.
6. Update `docs/ARCHITECTURE.md` under "QR Domain Model" and mark Module 1.3 complete in `docs/WORKLOG.md`.

Do not wire this into any page UI yet — Module 1.3 is domain/type-system only, per Structure → UI → Features.

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. The Next.js app lives at the repo root (not in a subfolder) — it was scaffolded into a temp `qr-code-generator/` dir (npm naming rejects capitalized dir names) and then moved up.
- Next.js version is 16.3.0, which is newer than most training data. Before writing framework-specific code, check `node_modules/next/dist/docs/` (bundled docs) — see `AGENTS.md` at the repo root, which `next dev` regenerates automatically. Key v16 gotchas are summarized in `docs/ARCHITECTURE.md` (async request APIs, `middleware.ts` → `proxy.ts` rename, removed `next lint`, etc.).
- Route params/searchParams are async in Next 16 — every dynamic page/route in this repo already follows `params: Promise<{...}>` + `await params`. Keep that pattern for new dynamic routes.
- If you add or move a top-level `page.tsx`, run `npx next typegen` (or `rm -rf .next` and rebuild) before `npm run typecheck` — stale generated route types otherwise fail the check with a misleading "Cannot find module" error.
- On this machine, port 3000 is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 in that case — check the `npm run dev` output for the actual port, and never stop a process on 3000 without confirming it's actually this project's server first (`Get-NetTCPConnection -LocalPort 3000` → match the PID before killing it).
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
