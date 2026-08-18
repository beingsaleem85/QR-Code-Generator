# Session Handoff

Use this file to resume work without re-deriving context.

## Current State

- **Phase:** 3 — Features (Phase 2 — UI is COMPLETE, gate passed)
- **Current module:** 3.2 — Static QR Generation (not yet started)
- **Last completed module:** 3.1 — Supabase Connection and Authentication (COMPLETE — live-verified against the user's actual hosted project, not just mocked)
- **Branch/commit:** local git repo (`master`). Check `git log --oneline -20` for the actual latest commit when resuming — as of writing, Modules 1.1–2.10 are committed and Module 3.1 is ready to commit.
- **Supabase integration status:** **Live and connected.** Project URL + anon key are in `.env.local` (gitignored). The live project's schema (all 8 migrations) has been pushed and matches `supabase/migrations/`. Real signup/login/logout/session-persistence/password-recovery/profile-upsert are all wired and were verified end-to-end against the live project (see `docs/WORKLOG.md`'s Module 3.1 entry) — this is no longer mock data for auth.
- **Test status:** 103 unit/component tests passing. `typecheck`, `lint` (0 errors), `format:check`, and a fresh production `build` (25 routes) all pass.

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

None. Module 3.2 doesn't need anything from the user to start.

## ⚠️ Read before doing browser-based verification

**The Browser pane cannot render/composite frames unless it is the actively-displayed pane** — `screenshot`/`read_page` return empty or time out otherwise, even though `get_page_text`, `read_network_requests`, `find`+`computer` clicks (via `ref`), and `javascript_tool` all still work fine regardless of visibility. This was re-confirmed in Module 3.1: a real login → dashboard → logout flow was successfully driven and verified through the real Browser pane this session (form_input + computer click actually work), so the earlier-session finding that "the Browser pane can't do click-driven interaction at all" was evidently environment/timing-specific, not a hard rule — but don't assume `read_page`/`screenshot` are reliable without the pane visibly open. For anything the pane still can't confirm, or for pure content/geometry checks, the established fallbacks remain solid: Vitest + Testing Library component tests for interactive logic, `curl` against the dev/production server for route-level content and redirect/status checks.

**Two testing lessons banked from Phase 2**, still relevant:

1. Don't wait on real `setTimeout`-based delays via `findByText`/`findByRole` — assert on the synchronous state transition instead.
2. Write the test asserting the _specific, correct_ behavior before assuming an implementation is right — several real bugs (Module 2.4's `forwardRef` gap, Module 2.6's active-link double-match) were only caught this way.

**Mocking Supabase in component tests (new, Module 3.1)**: `vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { <method>: vi.fn(...) } }) }))`, plus `vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))` for any component that redirects after a successful call. For a "still submitting" assertion, mock the Supabase call to return a promise that never resolves (`() => new Promise(() => {})`) rather than depending on timing — see `LoginForm.test.tsx`/`SignupForm.test.tsx`/etc. for the reference pattern.

**A latent-bug pattern from Module 2.5, still relevant**: a plain (non-`forwardRef`) component silently accepts `{...someProps}` containing a `ref` without a `tsc` error (spread bypasses excess-property checking), but an explicit `ref={x}` on the same component does error. Keep any new form-field primitive `forwardRef`-wrapped.

## Next Exact Task

Start Module 3.2 (Static QR Generation) — re-read its section in `QR_Code_Generator_Master_Build_Prompt.md` first for exact per-type acceptance criteria (URL/Text/Email/Phone/SMS/WhatsApp/Wi-Fi/vCard/Event) before building, rather than assuming scope from this note:

1. **No QR-code-image generation library is installed yet** — research and add one (e.g. `qrcode` on npm is the common choice for SVG/PNG output in Node/browser). The payload-building logic for all 9 static types already exists and is tested (Module 1.3, `src/lib/qr/registry.ts` + content forms) — this module is about turning that validated payload string into an actual scannable QR code image and wiring real download, not rebuilding validation.
2. `QRPreviewPanel` (Module 1.6/2.4) currently renders `QrPlaceholderGraphic` — replace with the real generated QR once a library is chosen, preserving the existing preview panel layout/props shape where reasonable.
3. Download buttons across the app (generator shell, QR detail page) are currently `disabled` placeholders — Module 3.4 (QR Download and Export) is more likely the right home for full download wiring per the master prompt's module split, but re-check its exact scope before assuming 3.2 shouldn't touch downloads at all (the master prompt lists "support download" under 3.2's per-type requirements too — resolve this overlap by reading both module sections together, not by guessing).
4. Preserve Unicode in payloads (already true of the existing builders — verify it still holds through whatever encoding step the QR library needs).
5. Document in `docs/ARCHITECTURE.md`, mark Module 3.2 complete in `docs/WORKLOG.md`, commit. Continue autonomously into Module 3.3 (QR Styling and Live Preview Engine) afterward per the standing instruction, unless a blocking need arises.

## Notes for Future Sessions

- Repo root is `D:\AntiGravity\QR`. Next.js app at repo root (not a subfolder).
- Next.js 16.3.0 — check `node_modules/next/dist/docs/` before assuming v15-era behavior. `params`/`searchParams`/`cookies()`/`headers()` are all async.
- **Tailwind v4** (`^4.3.3`), CSS-first `@theme` in `src/app/globals.css`. This project's `--radius-sm/md/lg` override Tailwind's own built-in radius scale of the same names.
- **Design system**: primary `#0F766E`. Use the `src/components/ui/` primitives (`Button`/`buttonVariants()`, `Card`, `Input`/`Textarea`/`Select`/`FormField`/`PasswordInput`/`Alert`/`AccordionItem`) rather than raw markup.
- **Three route-group layouts**: `(marketing)` (Header/Footer), `(auth)` (centered `AuthCard`), `(dashboard)` (Sidebar + mobile drawer, now with a real `getAuthenticatedUser()` guard and a working Log Out control). Don't duplicate any of their chrome inside individual pages.
- **Auth is real now (Module 3.1)** — `src/lib/supabase/{client,server,dal,profile}.ts` + `src/proxy.ts` + `src/lib/supabase/actions.ts` (`logout()`). `proxy.ts` does the optimistic cookie check; `getAuthenticatedUser()` (DAL) is the mandatory database-verified re-check called from `(dashboard)/layout.tsx` — don't remove either half, they're deliberately layered per Next.js's own auth guidance, not redundant.
- **Mock data still in use**: `src/lib/qr/mock-data.ts` (`MOCK_QR_CODES`, `findMockQrCode(id)`, `MOCK_ANALYTICS_NOW`, `MOCK_SCAN_EVENTS`), `src/lib/account/mock-data.ts` (`MOCK_PROFILE` — **known gap**, the real signed-in user's data isn't wired into the Account page yet, no master-prompt module explicitly owns this, see `docs/ARCHITECTURE.md`'s Module 3.1 section), `src/lib/files/mock-data.ts` (`MOCK_ASSETS`). These get replaced by their respective owning modules (3.5 for QR codes, 3.8 for files) — don't replace early just because auth is now real.
- **Component architecture**: `QRTypeSelector`/`QRContentPanel` read from `qrTypeRegistry` (`src/lib/qr/registry.ts`) — never hardcode a QR type list. `DASHBOARD_NAV_ITEMS` is the single source for dashboard nav. `QrPlaceholderGraphic` is the single source for the abstract placeholder graphic — will need replacing with real QR rendering starting Module 3.2, but don't delete it outright since it may still be useful as a loading/error fallback state. `src/lib/analytics/aggregate.ts` holds pure, reusable event-aggregation functions.
- **jsdom gap, resolved**: `HTMLDialogElement.prototype.showModal`/`.close` are unimplemented in this project's jsdom version — polyfilled globally in `tests/setup.ts`.
- **Known, accepted Next.js limitation**: `notFound()` on this app returns HTTP 200, not 404, because the root `src/app/loading.tsx` creates a Suspense boundary above every route and streaming locks in the already-sent 200 status before `notFound()` can run. Documented in `docs/ARCHITECTURE.md` under Module 2.7. Not a regression to "fix" reflexively if it resurfaces elsewhere.
- **No charting library installed on purpose** (Module 2.8's charts are hand-rolled). Don't add one without a real reason.
- **Local Supabase via Docker still works** — `supabase/config.toml` exists, ports `54321`–`54329`. Useful for iterating on new migrations before `db push`ing them live. `supabase start` on an existing volume does **not** auto-apply new migrations — use `supabase db reset` after adding one.
- **The live project is now linked** (`supabase link`, Module 3.1) — `supabase/.temp/` holds the link state, gitignored via `supabase/.gitignore`. `SUPABASE_ACCESS_TOKEN` is not stored anywhere persistent (not in `.env.local`, not committed) — it was used interactively for the link/push/query calls in Module 3.1 and isn't needed again unless another live migration push or ad-hoc live query is required.
- **Live project auth config**: `mailer_autoconfirm=false` (real email confirmation required for signup — the "check your email" path in `SignupForm` is the one real users take), `disable_signup=false`, `uri_allow_list` includes `http://localhost:3000/**` (needed for `/auth/callback` redirects to be accepted — will need the production URL added too once one exists).
- RLS design intentionally leaves two gaps that are **not bugs**: `qr_codes` has no `anon` SELECT policy, `qr_scan_events` has no client-facing INSERT policy at all.
- On this machine, port 3000 is sometimes already in use by an unrelated project (`D:\AntiGravity\LMS`). Next.js auto-falls-back to 3001 — check the actual port before assuming. **Do not use a broad `taskkill /IM node.exe` (or equivalent kill-all-node-processes command) to stop a dev server** — it kills every Node process on the machine, including unrelated projects' dev servers if any are running. Find and stop only the specific PID for the server you started.
- Master build spec: [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) at the repo root is the single source of truth for module order and acceptance criteria. Follow it exactly — do not merge or reorder Structure → UI → Features.
