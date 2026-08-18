# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 3 — Features (Phase 2 — UI is COMPLETE, gate passed)
- **Current module:** 3.6 — Dynamic QR Codes (not yet started)
- **Last completed module:** 3.5 — Saving and Managing QR Codes (COMPLETE)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -20` for the actual latest commit when resuming — as of writing, Modules 1.1–3.4 are committed and Module 3.5 is ready to commit.
- **Supabase integration status:** **Live and connected.** Project URL + anon key are in `.env.local` (gitignored). Schema (all 8 migrations) matches `supabase/migrations/`. Real auth (Module 3.1) and now **real QR persistence** (Module 3.5) — `qr_codes` CRUD is fully wired, RLS-verified live with two real accounts. `qr_scan_events` still has no writer yet (Module 3.6/3.7).
- **QR rendering status:** Fully real, fully styled, and fully exportable — see Modules 3.2–3.4. Nothing changed here this module; Module 3.5 only changed _where the config comes from_ (a saved row instead of live-only generator state), not how it's rendered.
- **QR persistence status (new, Module 3.5)**: Save/Update/Duplicate/Archive/Delete all real, RLS-enforced, ownership from the session only (`src/lib/qr/actions.ts`). Dashboard overview/list/detail/edit pages all use real data (`src/lib/qr/queries.ts`). `/r/[slug]` still doesn't exist yet (Module 1.2's stub) — that's Module 3.6.
- **Test status:** 215 unit/component tests passing. `typecheck`, `lint` (0 errors), `format:check`, and a fresh production `build` (25 routes) all pass.

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

# Local Supabase (Docker required, fully offline, no account needed — still used for schema
# iteration/testing before pushing to the live project):
supabase start        # reuses existing DB volume; does NOT auto-apply new migrations
supabase db reset     # drops + recreates from supabase/migrations/*.sql + seed.sql
supabase stop

# Live project (now linked — supabase/.temp/ holds the link, gitignored):
supabase db push --linked      # push new migrations to the live project
supabase db query --linked -o json   # ad-hoc read-only SQL against the live project
```

## Current Blockers

None. Module 3.6 doesn't need anything from the user to start.

## ⚠️ Read before doing browser-based verification

**The Browser pane's reliability for interaction testing varies within the same session — verify before trusting it, don't assume either way.** In Module 3.1, `read_page`/`screenshot`/`computer` clicks worked for the login form (a real login → dashboard → logout cycle was driven and confirmed this way). Later the same session, for Module 3.2's generator page, `read_page`/`screenshot` returned empty/timed out again (the pane-compositing limitation from earlier in this project), and — notably — a scripted workaround (native `HTMLInputElement` value setter + dispatched `input` event, the classic React 16-era trick for faking user input) did **not** reach React Hook Form's `watch()` subscription in this environment; root cause unconfirmed, possibly a React 19 internals difference. `get_page_text`, `read_network_requests`, and `javascript_tool` reads (not simulated writes) kept working throughout both cases.

**Practical guidance**: try the Browser pane, but check early (e.g. `read_page` right after navigating) whether it's actually compositing this session before relying on it for a multi-step interaction. If it isn't, don't fight it with JS-injection workarounds — fall back to the established, always-reliable methods: Vitest + Testing Library component tests (using real `userEvent`, which drives actual browser-equivalent input events through jsdom more faithfully than a hand-rolled script) for interactive logic, and `curl` against the dev/production server for route-level content, redirect, and status checks.

**A second, unrelated live-verification constraint hit in Module 3.5**: the live Supabase project has a project-wide email send rate limit (shared free-tier SMTP). After a few confirmation emails in one session (creating throwaway test accounts for RLS/browser verification), further signups return `429 over_email_send_rate_limit` — this blocks provisioning _new_ confirmed test accounts, separate from the Browser-pane issue above. If you hit this: don't retry in a loop (respect the platform's limit); either wait, reuse an existing still-valid test session within the same run if one exists, or document the gap honestly per the master prompt's own instruction to prefer strong component/integration evidence over a skipped/faked manual check.

**Two testing lessons banked from Phase 2**, still relevant:

1. Don't wait on real `setTimeout`-based delays via `findByText`/`findByRole` — assert on the synchronous state transition instead.
2. Write the test asserting the _specific, correct_ behavior before assuming an implementation is right — several real bugs (Module 2.4's `forwardRef` gap, Module 2.6's active-link double-match) were only caught this way.

**Mocking Supabase in component tests (new, Module 3.1)**: `vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { <method>: vi.fn(...) } }) }))`, plus `vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))` for any component that redirects after a successful call. For a "still submitting" assertion, mock the Supabase call to return a promise that never resolves (`() => new Promise(() => {})`) rather than depending on timing — see `LoginForm.test.tsx`/`SignupForm.test.tsx`/etc. for the reference pattern.

**A latent-bug pattern from Module 2.5, still relevant**: a plain (non-`forwardRef`) component silently accepts `{...someProps}` containing a `ref` without a `tsc` error (spread bypasses excess-property checking), but an explicit `ref={x}` on the same component does error. Keep any new form-field primitive `forwardRef`-wrapped.

## Next Exact Task

Start Module 3.6 (Dynamic QR Codes) — re-read its full section in `QR_Code_Generator_Master_Build_Prompt.md` first:

1. **`/r/[slug]` redirect route** (currently a Module 1.2 stub) needs to: resolve the slug efficiently, reject missing/invalid/inactive codes cleanly (a code with `status != 'active'` should not redirect — decide what it shows instead), record the scan (async/efficient — this is genuinely Module 3.7's fuller analytics job, but _a_ write to `qr_scan_events` belongs here per 3.6's own "Record scan asynchronously or efficiently" requirement), redirect safely (validate the stored `destination_url` isn't something dangerous before redirecting — the master prompt explicitly calls out open-redirect prevention), and avoid exposing internal DB ids in the redirect itself.
2. **Slug resolution must not use a client-facing RLS SELECT policy** — `qr_codes` intentionally has no `anon` SELECT policy (Module 1.5's own documented, deliberate gap; see `docs/ARCHITECTURE.md`'s Auth/RLS section). Resolve slugs server-side via either the service-role key (first real, justified use of `SUPABASE_SERVICE_ROLE_KEY` in this project — still never expose it client-side) or a narrow `SECURITY DEFINER` RPC function that returns only the minimum fields a redirect needs.
3. **Set/change destination**: dynamic QR codes need a real "destination" field distinct from `payload_data` — `qr_codes.destination_url` already exists in the schema for exactly this (currently unused/always null, per Module 3.5's records.ts). Wire the generator/edit flow so a dynamic QR's destination can be set at creation and changed later _without_ changing the slug or requiring a new printed code — that's the entire point of "dynamic."
4. **Pause/reactivate**: `status = 'paused'` already exists as a valid value (Module 1.4's check constraint) but nothing sets it yet — `setQrCodeStatus()` (Module 3.5, `src/lib/qr/actions.ts`) already supports arbitrary `QRCodeStatus` values, so this is mostly a UI affordance away, not new server logic.
5. **Slug requirements**: URL-safe, hard to guess, unique, never sequential — `generateRandomSlug()` (`src/lib/qr/slug.ts`, Module 3.5) already satisfies all four; reuse it, don't build a second slug generator.
6. Document in `docs/ARCHITECTURE.md`, mark Module 3.6 complete in `docs/WORKLOG.md`, commit. Continue autonomously into Module 3.7 (Scan Analytics — this is where `qr_scan_events` gets a real reader, replacing the empty-events honesty-state added to the analytics page in Module 3.5) afterward per the standing instruction, unless a blocking need arises.

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. Next.js app at repo root (not a subfolder).
- Next.js 16.3.0 — check `node_modules/next/dist/docs/` before assuming v15-era behavior. `params`/`searchParams`/`cookies()`/`headers()` are all async.
- **Tailwind v4** (`^4.3.3`), CSS-first `@theme` in `src/app/globals.css`. This project's `--radius-sm/md/lg` override Tailwind's own built-in radius scale of the same names.
- **Design system**: primary `#0F766E`. Use the `src/components/ui/` primitives (`Button`/`buttonVariants()`, `Card`, `Input`/`Textarea`/`Select`/`FormField`/`PasswordInput`/`Alert`/`AccordionItem`) rather than raw markup.
- **Three route-group layouts**: `(marketing)` (Header/Footer), `(auth)` (centered `AuthCard`), `(dashboard)` (Sidebar + mobile drawer, now with a real `getAuthenticatedUser()` guard and a working Log Out control). Don't duplicate any of their chrome inside individual pages.
- **Auth is real now (Module 3.1)** — `src/lib/supabase/{client,server,dal,profile}.ts` + `src/proxy.ts` + `src/lib/supabase/actions.ts` (`logout()`). `proxy.ts` does the optimistic cookie check; `getAuthenticatedUser()` (DAL) is the mandatory database-verified re-check called from `(dashboard)/layout.tsx` — don't remove either half, they're deliberately layered per Next.js's own auth guidance, not redundant.
- **QR persistence is real now (Module 3.5)** — `src/lib/qr/{records,queries,actions,action-types,slug,draft-storage}.ts`. Read `docs/ARCHITECTURE.md`'s Module 3.5 section before touching any of these; in particular, `actions.ts` has a top-level `"use server"` directive, which means it **may only export async functions** — any new constant/type export belongs in `action-types.ts` instead, or the production build fails opaquely ("module has no exports") in a way typecheck/lint won't catch. Always run a real `npm run build` after touching Server Action files, not just typecheck.
- **Mock data remaining**: `src/lib/qr/mock-data.ts` now only exports `MOCK_QR_CODES`, used solely by the Files page's mock "linked QR code" lookup (Module 2.9) — stays mock until Module 3.8. `src/lib/account/mock-data.ts` (`MOCK_PROFILE` — **known gap**, the real signed-in user's data isn't wired into the Account page yet, no master-prompt module explicitly owns this, see `docs/ARCHITECTURE.md`'s Module 3.1 section), `src/lib/files/mock-data.ts` (`MOCK_ASSETS`, until Module 3.8). Don't add new consumers of any of these — everything else now has real data.
- **Component architecture**: `QRTypeSelector`/`QRContentPanel` read from `qrTypeRegistry` (`src/lib/qr/registry.ts`) — never hardcode a QR type list. `DASHBOARD_NAV_ITEMS` is the single source for dashboard nav. `QrPlaceholderGraphic` is now only a fallback (invalid/empty content in `QRPreviewPanel`) — the QR detail page server-renders a real regenerated SVG. `QRCodeRowActions` (Module 3.5) is the single implementation of Duplicate/Archive/Delete/Download, used on both the list and the detail page (`showDownload` prop toggles the list-only quick-download button). `src/lib/analytics/aggregate.ts` holds pure, reusable event-aggregation functions — still unused by real data until Module 3.7.
- **QR rendering (Modules 3.2–3.4, all complete)**: `src/lib/qr/render.ts` — `buildQrPayload()` (validate content against the type's Zod schema, then build), `slugifyForFilename()` (now the complete filename policy — Unicode-normalized, diacritics stripped, length-capped), plus the plain `renderQrSvg()`/`renderQrPngDataUrl()` kept only as Module 3.3's error fallback (don't call these directly from new UI — use the styled versions). `src/lib/qr/matrix.ts` (raw module matrix + finder-region geometry) and `src/lib/qr/styled-svg.ts` (`renderStyledQrSvg()`/`renderStyledQrPngDataUrl(payload, design, targetWidth)` — the real, fully-styled renderer everything should call; `targetWidth` is how the 512/1024/2048px presets work) are the current single sources of truth for turning content into a rendered QR. `src/lib/qr/reliability.ts` holds the contrast/logo-size/EC-level/quiet-zone rules — reuse these, don't reimplement. `src/lib/qr/logo.ts`'s `readLogoFile()` is the only place that should touch logo file input handling. **Module 3.5 note**: this whole pipeline is what "regenerate visuals from saved config" means — never store a rendered image in Postgres, store `design_config`/payload and call `renderStyledQrSvg`/`renderStyledQrPngDataUrl` again whenever a saved QR needs to be shown or downloaded.
- **jsdom gap, resolved**: `HTMLDialogElement.prototype.showModal`/`.close` are unimplemented in this project's jsdom version — polyfilled globally in `tests/setup.ts`.
- **Known, accepted Next.js limitation**: `notFound()` on this app returns HTTP 200, not 404, because the root `src/app/loading.tsx` creates a Suspense boundary above every route and streaming locks in the already-sent 200 status before `notFound()` can run. Documented in `docs/ARCHITECTURE.md` under Module 2.7. Not a regression to "fix" reflexively if it resurfaces elsewhere.
- **No charting library installed on purpose** (Module 2.8's charts are hand-rolled). Don't add one without a real reason.
- **Local Supabase via Docker still works** — `supabase/config.toml` exists, ports `54321`–`54329`. Useful for iterating on new migrations before `db push`ing them live. `supabase start` on an existing volume does **not** auto-apply new migrations — use `supabase db reset` after adding one.
- **The live project is now linked** (`supabase link`, Module 3.1) — `supabase/.temp/` holds the link state, gitignored via `supabase/.gitignore`. `SUPABASE_ACCESS_TOKEN` is not stored anywhere persistent (not in `.env.local`, not committed) — it was used interactively for the link/push/query calls in Module 3.1 and isn't needed again unless another live migration push or ad-hoc live query is required.
- **Live project auth config**: `mailer_autoconfirm=false` (real email confirmation required for signup — the "check your email" path in `SignupForm` is the one real users take), `disable_signup=false`, `uri_allow_list` includes `http://localhost:3000/**` (needed for `/auth/callback` redirects to be accepted — will need the production URL added too once one exists).
- RLS design intentionally leaves two gaps that are **not bugs**: `qr_codes` has no `anon` SELECT policy, `qr_scan_events` has no client-facing INSERT policy at all.
- On this machine, port 3000 is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 — check the actual port before assuming. **Do not use a broad `taskkill /IM node.exe` (or equivalent kill-all-node-processes command) to stop a dev server** — it kills every Node process on the machine, including unrelated projects' dev servers if any are running. Find and stop only the specific PID for the server you started.
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
