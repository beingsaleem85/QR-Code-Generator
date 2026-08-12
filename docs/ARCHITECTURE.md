# Architecture

Status: Structure phase, Module 1.1. This document grows with each module; sections below marked "TBD" are filled in by their corresponding module.

## Stack

- Next.js (App Router), latest stable — currently 16.3.0, Turbopack by default for `dev` and `build`
- TypeScript, strict mode, no unnecessary `any`
- React 19.2
- Tailwind CSS 4
- ESLint (flat config, `eslint.config.mjs`) + Prettier
- Supabase (Postgres, Auth, Storage, RLS) — integrated starting Module 3.1

### Next.js 16 notes relevant to this codebase

- `cookies()`, `headers()`, `draftMode()`, `params`, and `searchParams` are async-only — always `await` them.
- Auth/session middleware must be named `proxy.ts` (the `middleware.ts` convention is deprecated in v16); the `proxy` runtime is `nodejs` only.
- `next lint` is removed; linting runs via the ESLint CLI (`npm run lint`).
- Parallel route slots require an explicit `default.js`/`default.tsx` if parallel routes are introduced later.

## Directory Layout

```text
src/
  app/                  Next.js App Router routes, layouts, error/loading/not-found conventions
  components/
    ui/                 Low-level reusable UI primitives (buttons, inputs, dialogs, etc.)
    layout/              Structural layout components (headers, shells, sidebars)
    marketing/           Public marketing-site-specific components
    qr/                  QR builder/preview components
    dashboard/           Authenticated dashboard components
    analytics/           Analytics UI components (charts, summary cards, filters)
  features/              Feature-oriented modules combining UI + client logic per domain
    auth/
    qr-builder/
    qr-management/
    analytics/
    landing-pages/
    account/
  lib/                   Framework-agnostic domain/utility code, importable from client or server
    supabase/             Supabase client factories (browser/server) — added in Module 1.5 / 3.1
    qr/                   QR type registry, payload builders, validation (Module 1.3)
    validation/           Shared Zod schemas
    utils/                 Generic helpers
  server/                 Server-only code, never imported from Client Components
    actions/               Next.js Server Actions
    repositories/           Supabase data-access functions
    services/               Business logic orchestration
  types/                  Shared TypeScript types
  config/                 Static app configuration (site metadata, nav, feature flags)
supabase/
  migrations/             SQL migrations (Module 1.4+)
  seed.sql                Non-sensitive local dev seed data
docs/                     Project documentation
tests/
  unit/
  integration/
  e2e/
```

Folders created in Module 1.1 are currently empty skeletons (tracked via `.gitkeep`) — they exist to fix naming/ownership conventions before feature code lands, per the Structure → UI → Features build order.

## State Ownership Rule

- Purely visual/local state → component state
- Form state → the form library once introduced (React Hook Form + Zod), not ad hoc
- Filters/list state that should survive navigation → URL/query state
- Persisted data → Supabase via `server/repositories`, never queried ad hoc from components
- Cross-panel coordination (e.g. QR builder content + design + preview) → a small dedicated store only if actually required (Module 1.6 / 2.4)

No single global store for the whole app.

## Route Architecture

Established in Module 1.2. All routes currently render structural placeholders (`RouteStub`) or define a response contract — no auth, data fetching, or final UI yet.

### Public routes — `src/app/(marketing)/`

Route group, no URL prefix. Marketing/content pages plus the public generator entry point.

```text
/                /(marketing)/page.tsx
/qr-generator    /(marketing)/qr-generator/page.tsx
/qr-types        /(marketing)/qr-types/page.tsx
/static-qr       /(marketing)/static-qr/page.tsx
/dynamic-qr      /(marketing)/dynamic-qr/page.tsx
/features        /(marketing)/features/page.tsx
/pricing         /(marketing)/pricing/page.tsx
/faq             /(marketing)/faq/page.tsx
```

### Auth routes — `src/app/(auth)/`

```text
/login             /(auth)/login/page.tsx
/signup            /(auth)/signup/page.tsx
/forgot-password   /(auth)/forgot-password/page.tsx
```

### Authenticated routes — `src/app/(dashboard)/dashboard/`

```text
/dashboard                          overview
/dashboard/qr-codes                 list
/dashboard/qr-codes/new             create
/dashboard/qr-codes/[id]            detail
/dashboard/qr-codes/[id]/edit       edit
/dashboard/qr-codes/[id]/analytics  analytics
/dashboard/files                    uploaded assets
/dashboard/account                  profile/account
/dashboard/settings                 app settings
```

### Public dynamic redirect — `src/app/r/[slug]/route.ts`

A **Route Handler**, not a page — it never renders HTML, it resolves and redirects. `GET` awaits `slug`, calls `resolveDynamicQrRedirect` (`src/server/services/redirect-resolution.ts`), and either 302-redirects to the resolved destination or returns a 404 JSON body. The resolution function is a typed stub today (`{ status: "not_found" }` unconditionally) — Module 3.6 replaces the body with the real Supabase lookup, scan-event recording, and open-redirect validation. Keeping the contract (`RedirectResolution` union) stable now means Module 3.6 only changes the function body, not the route.

### Hosted landing pages — `src/app/p/[slug]/page.tsx`

A real page (unlike `/r/[slug]`) since it renders a hosted mini-page (link-in-bio, PDF viewer, gallery, etc.) rather than redirecting. Content wiring lands in Module 3.9.

### API routes — `src/app/api/`

`api/health` (Module 1.1) is the only route so far. Additional API routes are added only where a Server Action or Route Handler genuinely needs one.

### Protected-route strategy (documented now, implemented in Module 1.5 / 3.1)

`(dashboard)` routes will be protected by a `proxy.ts` at the repo root (Next.js 16 renamed `middleware.ts` → `proxy.ts`) that checks for a valid Supabase session and redirects unauthenticated requests to `/login`. Route-level pages must **also** re-check authorization server-side (in `server/actions` and `server/repositories`) rather than relying on the proxy alone — the proxy is a UX redirect, not the authorization boundary. No proxy exists yet; Module 1.2 intentionally leaves `(dashboard)` routes open since there is no auth to enforce yet.

### Redirect vs. landing-page separation

`/r/[slug]` and `/p/[slug]` are deliberately different route trees with different response types (redirect vs. rendered page) so that dynamic-QR redirect latency is never coupled to landing-page rendering cost (Module 3.13 performance requirement).

## QR Domain Model

Established in Module 1.3. Domain code is UI- and QR-rendering-library-agnostic — nothing under `src/lib/qr` or `src/types` imports React or a QR rendering package.

### Types (`src/types/qr.ts`)

- `QRMode = "static" | "dynamic"`
- `QRType` — the 20-member union listed in the master build prompt (§3.2)
- `QRTypeDefinition` — one registry entry: `key`, `label`, `icon` (a UI-layer icon key, not a component — resolved to an actual icon in the UI phase), `staticSupport`/`dynamicSupport`, `fields` (a Zod schema), an optional `payloadBuilder`, `needsStorage`/`needsLandingPage`/`supportsAnalytics` flags, and `previewUpdateStrategy` (`"immediate" | "debounced"`, used later to decide which design controls need a debounced preview per §3.4)

### Registry (`src/lib/qr/registry.ts`)

`qrTypeRegistry: Record<QRType, QRTypeDefinition>` is the single source of truth — no scattered `if (type === "url")` conditionals elsewhere. `getQrTypeDefinition(type)` and `listQrTypeDefinitions()` are the read APIs.

All 20 types have a registry entry. Only the 9 types the master prompt explicitly names in §1.3 have a real `fields` schema and `payloadBuilder`: `url`, `text`, `email`, `phone`, `sms`, `whatsapp`, `wifi`, `vcard`, `event`. The rest (`pdf`, `app`, `images`, `video`, `social`, `barcode_2d`, `multi_link`, `menu`, `feedback`, `audio`, `location`) use a shared placeholder schema and an undefined `payloadBuilder` — they need Supabase Storage, hosted landing pages, or both, which don't exist until Phase 3. Wiring their real fields/builder is scoped to the module that adds that capability (Module 3.8 or 3.9), not Module 1.3.

Because `QRTypeDefinition` has to hold 9 structurally different `fields`/`payloadBuilder` shapes in one map, `payloadBuilder` is stored as a type-erased `(input: Record<string, unknown>) => string`. The erasure is contained to a single helper (`toGenericBuilder`) in `registry.ts` — every individual builder function is still fully typed against its own input. Code that already knows the concrete QR type should import the specific builder from `src/lib/qr/payload-builders` directly rather than going through the registry's erased signature.

### Payload builders (`src/lib/qr/payload-builders/`)

One pure function per format — `buildUrlPayload`, `buildTextPayload`, `buildEmailPayload` (`mailto:`), `buildPhonePayload` (`tel:`), `buildSmsPayload` (`sms:`), `buildWhatsAppPayload` (`https://wa.me/...`), `buildWifiPayload` (`WIFI:...`), `buildVCardPayload` (vCard 3.0), `buildEventPayload` (iCalendar `VEVENT`). Each takes its already-validated (Zod-parsed) input and returns the encoded payload string — no QR canvas/SVG rendering happens here or anywhere in `lib/qr`; that's a separate renderer adapter added in Module 3.3. WIFI and vCard/iCalendar special-character escaping live in `payload-builders/shared/escaping.ts` since both formats need it.

### Validation (`src/lib/validation/qr/`)

One Zod schema per implemented type, each exporting both the schema and its inferred TS input type (e.g. `urlQrSchema` / `UrlQrInput`). Validation is a distinct step from payload building — a caller parses user input with the schema first, then passes the parsed result to the builder. Notable validation decisions: the URL schema normalizes scheme-less input to `https://` and rejects everything except `http`/`https` (blocks `javascript:`, `data:`, etc.); the Wi-Fi schema requires a password unless encryption is `"nopass"`; the vCard schema requires at least a first or last name; the event schema rejects an end time before the start time.

### Testing

Unit tests live under `tests/unit/qr/`, run via Vitest (`npm run test`). Every implemented payload builder has valid-input, invalid-input, and Unicode-preservation cases; `registry.test.ts` checks structural invariants (all 20 types present, keys self-consistent, a `payloadBuilder` exists if and only if the type is one of the 9 implemented ones).

## Database Schema

Established in Module 1.4 as migrations under `supabase/migrations/` (schema design only — no live Supabase project exists yet; validated locally via `supabase start` on Docker, not against a hosted project).

### Tables

**`profiles`** — one row per authenticated user (`id` = `auth.users.id`, cascade-deleted with the auth user). `display_name`, `avatar_url`, timestamps. `updated_at` auto-maintained by the shared `set_updated_at()` trigger.

**`qr_folders`** — optional single-level organization. `user_id`, `name` (unique per user), `created_at`. A single level (no folder hierarchy, no many-to-many join table) was chosen over a full tree since the master prompt explicitly calls for "the simpler structure appropriate for one-folder vs multi-folder organization" and the MVP only needs one.

**`qr_codes`** — the core record, shared by static and dynamic codes:

- `mode` (`static`/`dynamic`) and `qr_type` (one of the 20 `QRType` values — the check constraint's value list **must stay in sync with `src/types/qr.ts`**)
- `status` (`active`/`paused`/`archived`)
- `payload_data` and `design_config` — JSONB, versionable, never contain secrets
- `destination_url` — the current redirect target, dynamic codes only
- `landing_page_config` — JSONB, null until a hosted-landing-page type (Module 3.9) is attached
- `slug` — nullable (static codes don't need one), but **unique when present** via a partial unique index; a check constraint enforces that every `dynamic` row has a non-null slug
- `folder_id` → `qr_folders`, `on delete set null` (deleting a folder must not delete its QR codes)
- Indexes: `user_id`, `created_at`, `folder_id`, plus the partial unique index on `slug`

**`qr_scan_events`** — one row per dynamic-QR scan. Deliberately **omits raw IP and raw User-Agent columns entirely** (stricter than the master prompt's "nullable or privacy-minimized" suggestion) — only derived fields exist: `country_code`, `region`, `city`, `device_type`, `os`, `browser`, `referrer`, and an optional `ip_hash` (salted/hashed, populated only if a documented product/legal need arises). The application layer must derive these before insert; there is no column to accidentally store the raw values in. Indexes: `qr_code_id`, `scanned_at`, and a compound `(qr_code_id, scanned_at)` for the analytics queries in Module 3.7.

**`qr_assets`** — metadata for Supabase Storage uploads (logos, PDFs, gallery images, audio). The file itself lives in Storage; this row tracks `bucket` + `path` (unique together), `mime_type`, `size_bytes`, and an optional `qr_code_id` link (`on delete set null`, since an asset can outlive the QR code that first referenced it — e.g. a logo reused across codes).

### Delete behavior (consciously chosen, not default)

- `auth.users` → `profiles`/`qr_folders`/`qr_codes`/`qr_assets`: `cascade` — a deleted auth user's owned rows are deleted with them.
- `qr_codes` → `qr_scan_events`: `cascade` — scan history has no meaning without its QR code.
- `qr_folders` → `qr_codes.folder_id`: `set null` — deleting a folder must not delete the codes in it.
- `qr_codes` → `qr_assets.qr_code_id`: `set null` — an asset (e.g. a logo) can outlive the specific code it was first attached to.

### RLS status

Every table has `alter table ... enable row level security;` in its creation migration (default-deny, per Supabase convention: enabling RLS before any policy exists blocks all access rather than leaving the table open). **No policies exist yet** — writing them is explicitly Module 1.5's job, not this one.

### Local validation

Migrations were applied to a local, Docker-only Postgres instance via `supabase start` / `supabase db reset` to confirm they run cleanly and in order — no live/hosted Supabase project or credentials were involved. See `docs/WORKLOG.md` Module 1.4 for the exact commands and result.

## Auth, Storage, and RLS

Established in Module 1.5 (design only — no live Supabase project exists yet; validated locally via Docker, same as Module 1.4). Actual auth wiring (signup/login/session handling) is Module 3.1.

### RLS policies (`supabase/migrations/20260813010001_add_table_rls_policies.sql`)

Straightforward owner-only CRUD (`auth.uid() = user_id`, or `= id` for `profiles`) on `profiles`, `qr_folders`, `qr_codes`, and `qr_assets`. Two tables are deliberately **not** given the obvious policy set:

- **`qr_codes` has no `anon` SELECT policy.** Per the master build prompt (§7): "Do not open unrestricted public SELECT access to full `qr_codes` rows merely to support redirects." The public `/r/[slug]` and `/p/[slug]` routes must not read this table through a client-facing RLS policy at all — Module 3.6 resolves slugs through a privileged server-side path instead (the Supabase **service-role key**, which bypasses RLS entirely, or a narrow `SECURITY DEFINER` RPC function returning only the fields a redirect needs). This is a schema/RLS design decision made now so Module 3.6 isn't tempted to bolt on a broad `anon` policy later for convenience.
- **`qr_scan_events` has only a SELECT policy** (owner reads their own QR codes' scan history via a join on `qr_codes.user_id`, since the table itself has no `user_id` column). There is **no INSERT/UPDATE/DELETE policy for any client role** — a scanning visitor must never get direct table-level INSERT rights (that would let an attacker insert arbitrary `qr_code_id`s or forged event data into someone else's analytics), and the owner must not be able to edit their own scan history (that would let them falsify analytics). Module 3.7's redirect route writes scan events through the same privileged server-side path used for redirect resolution — it resolves the slug and attaches the `qr_code_id` internally rather than trusting client input, per master build prompt §7.

### Storage buckets (`supabase/migrations/20260813010002_create_storage_buckets.sql`)

| Bucket         | Public? | Allowed types          | Size limit | Used by                |
| -------------- | ------- | ---------------------- | ---------- | ---------------------- |
| `avatars`      | Yes     | png/jpeg/webp          | 5 MB       | Profile avatars        |
| `qr-logos`     | No      | png/jpeg/svg/webp      | 2 MB       | QR design logo uploads |
| `qr-documents` | No      | pdf                    | 20 MB      | PDF QR type            |
| `qr-gallery`   | No      | png/jpeg/webp/gif      | 10 MB      | Image gallery QR type  |
| `qr-media`     | No      | mpeg/mp4/wav/ogg audio | 15 MB      | Audio/MP3 QR type      |

`avatars` is the one bucket made public — profile pictures are displayed constantly across the UI and have no sensitive content, so serving a bare public URL avoids refreshing a signed URL on every render. Every other bucket is private: content should only be reachable through an owner action (dashboard) or a server-mediated flow (a signed URL, or the landing-page/redirect route), never a bare public URL — per master build prompt §1.5 ("Prefer private buckets... use signed URLs or controlled server delivery when necessary"). There is intentionally no bucket for video — per §3.8, self-hosting video is avoided in favor of linking an external host (YouTube/Vimeo/etc.).

**Path convention:** every object lives at `{user_id}/{qr_code_id_or_asset_id}/{sanitized_filename}`. The leading `{user_id}` segment is what the `storage.objects` RLS policies check against `auth.uid()` via `(storage.foldername(name))[1]` — user isolation is enforced by Postgres, not by client code choosing "nice" paths. File-type and size limits are enforced by Supabase Storage itself via each bucket's `allowed_mime_types`/`file_size_limit`, not just client-side validation.

### Server vs. client Supabase responsibilities

- **Browser client** (`src/lib/supabase/client.ts`, added in Module 3.1): only ever uses the anon/publishable key. Fine for anything RLS already protects correctly — the user's own dashboard reads/writes, uploading to their own Storage folder, auth state.
- **Server client** (`src/lib/supabase/server.ts`, added in Module 3.1): still the anon key by default (RLS-protected, but running in a trusted request context — Server Components/Actions), used for most authenticated server-side reads/writes.
- **`server/repositories`**: the only place that talks to Supabase directly (browser or server client). No component or Server Action queries Supabase ad hoc.
- **`server/actions`**: Next.js Server Actions that call into `server/repositories`; this is where server-side authorization re-checks belong (never trust a client-provided `user_id` — always derive it from the authenticated session), per master build prompt §12.
- **Service-role key**: server-only, never bundled into client code, used only for the narrow set of operations that must bypass RLS by design — resolving `/r/[slug]` redirects, writing `qr_scan_events`, and any admin/cron-style task. These are exactly the two policy gaps called out above.

### Acceptance status

- [x] RLS policies are explicit (see migration above)
- [x] Storage policy is explicit (bucket config + `storage.objects` policies above)
- [x] Server/client Supabase responsibilities documented (this section)
- [x] Privileged key usage is server-only (service-role key never referenced from client code; not even introduced yet)
- [x] No public policy accidentally grants access to all user data (validated locally — see `docs/WORKLOG.md` Module 1.5)

## Component Architecture

TBD — Module 1.6.

## Error Handling Conventions

Established in Module 1.1:

- `src/app/error.tsx` — route-segment error boundary (Client Component), offers retry via `reset()`
- `src/app/global-error.tsx` — root-level fallback; replaces the root layout, so it defines its own `<html>`/`<body>`
- `src/app/not-found.tsx` — rendered on `notFound()` calls or unmatched routes
- `src/app/loading.tsx` — route-segment loading fallback

These are neutral/unstyled skeletons for now; visual polish happens in Phase 2 (UI).
