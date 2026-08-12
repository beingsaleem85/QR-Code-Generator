# Architecture

Status: Phase 2 — UI, Module 2.2. This document grows with each module; sections below marked "TBD" are filled in by their corresponding module.

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
/privacy         /(marketing)/privacy/page.tsx    (added Module 2.2, footer link target)
/terms           /(marketing)/terms/page.tsx      (added Module 2.2, footer link target)
```

`src/app/(marketing)/layout.tsx` (Module 2.2) wraps every route in this group with `Header` + `Footer` — added when the header/footer were built rather than in Module 1.2, since a layout with no real header/footer to render would have been premature.

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

Established in Module 1.6 — component contracts and neutral skeletons, no final visual styling (that's Phase 2) and no real behavior beyond local state (that's Phase 2 UI wiring + Phase 3 features).

### QR generator (`src/components/qr/`)

`QRGeneratorShell` owns all state locally (`mode`, `qrType`, `name`, `content`, `design`) and passes slices down — no global store, per the state-ownership rule above. Children:

- `QRModeToggle`, `QRNameField` — top controls
- `QRTypeSelector` — reads `listQrTypeDefinitions()` from the Module 1.3 registry and filters by `staticSupport`/`dynamicSupport` for the current mode, so the type list is never hardcoded and automatically reflects registry changes
- `QRContentPanel` — resolves the selected type's label via `getQrTypeDefinition`; the real per-type form (driven by that same definition's `fields` Zod schema) is Module 2.4
- `QRDesignPanel` — composes `DesignFrameControls`, `DesignPatternControls`, `DesignEyeControls`, `DesignColorControls`, `DesignLogoControls` (`design-controls.tsx`), each scoped to its slice of `DesignConfig` (`src/types/qr-design.ts`)
- `QRPreviewPanel`, `QRDownloadActions` — sticky-column skeletons; real rendering is Module 3.3, real export/save is Module 3.4/3.5

Verified structurally: the shell is wired into `/qr-generator` and confirmed in a live dev server to switch type lists correctly between modes (13 static-support types vs. 12 dynamic-support types, matching the registry), update the content panel label on type change, and accept name-field input — with zero console errors.

### Dashboard (`src/components/dashboard/`)

`DashboardSidebar` (nav items match the Module 1.2 route map — no dead links to routes that don't exist), `DashboardHeader`, `QRCodeCard`/`QRCodeTable` (two presentations of the same `QRCodeSummary` type, `src/types/qr-record.ts`, for card vs. table viewport strategies per §2.6), `QRCodeStatusBadge`, `EmptyState` (generic — reused wherever a list has zero results, not just the QR list).

### Analytics (`src/components/analytics/`)

`AnalyticsSummaryCards`, `AnalyticsChartShell` (a generic labeled container, not a chart library integration — that's Module 2.8), `AnalyticsFilters`.

### Shared primitive

`src/components/ui/Placeholder.tsx` — every skeleton component above renders through this internally rather than duplicating the same "dashed border + label + description" markup 20+ times. It's an implementation detail, not part of any component's public contract; Phase 2 replaces each usage with real content independently.

### Form architecture (decided now, built out in Module 2.4)

- The QR type registry (`qrTypeRegistry`) is the single source of truth mapping a `QRType` to its content-form schema (`fields`) — no component switches on `qrType` with its own hardcoded field list.
- Form state (raw, possibly-invalid field values as the user types) is kept separate from persisted QR record state (`QRCodeSummary`/the eventual full record) — the shell's `content` state is the former, nothing here represents the latter yet.
- Design state (`DesignConfig`) is one shape reused across every QR type, not type-specific.
- Preview derives from validated form + design state; `previewUpdateStrategy` on each registry entry (`"immediate" | "debounced"`) already exists to drive which types need a debounced preview once real rendering lands.

### Acceptance status

- [x] Component responsibilities documented (this section)
- [x] Generator shell renders structurally (verified live, see above)
- [x] No giant monolithic builder component (`QRGeneratorShell` is ~50 lines of composition; every panel is its own component)
- [x] State ownership is clear (shell-local state, no global store; see "State Ownership Rule" above)

## Error Handling Conventions

Established in Module 1.1:

- `src/app/error.tsx` — route-segment error boundary (Client Component), offers retry via `reset()`
- `src/app/global-error.tsx` — root-level fallback; replaces the root layout, so it defines its own `<html>`/`<body>`
- `src/app/not-found.tsx` — rendered on `notFound()` calls or unmatched routes
- `src/app/loading.tsx` — route-segment loading fallback

These are neutral/unstyled skeletons for now; visual polish happens in Phase 2 (UI).

## Design System

Established in Module 2.1 (Phase 2 — UI). An original visual identity, not a QR.io clone: modern SaaS, light, spacious, trustworthy. Primary is a deep teal (`#0F766E`) — deliberately distinct from the generic blue/violet most SaaS and QR tools default to, while still reading as calm and professional rather than playful.

### Tokens (`src/app/globals.css`)

Tailwind 4 uses CSS-first configuration: tokens are plain CSS custom properties on `:root`, re-declared inside `@theme inline` so Tailwind generates matching utility classes automatically (`--color-primary` → `bg-primary`/`text-primary`/`border-primary`, etc.). Semantic color tokens: `background`, `surface`, `foreground`, `muted-foreground`, `border`, `primary` (+ `primary-hover`, `primary-foreground`), `destructive` (+ `destructive-foreground`), `success`, `warning`, `focus-ring`.

**Important Tailwind v4 detail:** the `--radius-sm`/`--radius-md`/`--radius-lg` tokens defined here **override Tailwind's own built-in default radius scale** (v4 ships with its own `--radius-*` namespace, and redefining the same names in `@theme` replaces them project-wide) — confirmed by inspecting the compiled CSS, not assumed. This means every `rounded-sm`/`rounded-md`/`rounded-lg` utility anywhere in the app automatically uses this project's moderate-radius values (8px/12px), not Tailwind's defaults, without needing a custom class name at every call site. `--control-height-sm/md/lg` (2rem/2.5rem/3rem) map to Tailwind's standard `h-8`/`h-10`/`h-12` — components use those standard utilities directly rather than an arbitrary-value CSS-var syntax, since that syntax's exact v4 semantics weren't worth risking on an unverified assumption when the standard scale already matched.

### Accessibility baked into the tokens, not bolted on after

- Every token combination actually used for text-on-background was checked against WCAG contrast math (not eyeballed): primary-on-white 5.47:1, foreground-on-background 16.98:1, muted-foreground-on-white 4.83:1, destructive-on-white 4.83:1 — all clear AA for normal text (4.5:1 minimum).
- `--color-focus-ring` was originally a lighter teal that measured 2.49:1 against white — below the 3:1 non-text-contrast minimum for a focus indicator (WCAG 1.4.11) — and was corrected to reuse the primary color (5.47:1) instead of shipping a focus ring that's technically present but hard to see.
- A global `*:focus-visible { outline: 2px solid var(--color-focus-ring); ... }` rule in `globals.css` gives every interactive element a visible focus state without relying on (inconsistent) browser defaults or per-component styling.
- A global `prefers-reduced-motion: reduce` block collapses animation/transition durations to near-zero.
- Dark mode is intentionally out of scope for this module — the master build prompt's visual direction (§2.1) describes a light-surface/white-card aesthetic and never asks for a dark theme; shipping a half-finished dark palette would violate more of the "accessible, consistent" requirement than it would satisfy.

### Core primitives (`src/components/ui/`)

`Button` (variants: primary/secondary/destructive/ghost; sizes: sm/md/lg) and `Card` were added as the first two real primitives. `Placeholder` (from Module 1.6) was migrated from hardcoded `gray-*` classes to the new semantic tokens — since roughly 15 Module 1.6 skeleton components render through `Placeholder` internally, this one change propagated the new design system across the generator content panel, all five design-control sections, the preview panel, and the analytics chart shell without touching each of them individually. `QRDownloadActions` was migrated from raw `<button>` markup to the new `Button` primitive, as a second, more direct proof point.

### Verified, not just built

Confirmed in the compiled production CSS (not just assumed from the source) that `bg-primary`, `text-primary-foreground`, `hover:bg-primary-hover`, and `border-border` all generated real rules referencing the right custom properties. Confirmed live in a running production server + browser session that the "Save QR" button computes to the exact primary color (`rgb(15, 118, 110)` = `#0F766E`) with white text and the intended radius, that the `Placeholder` component's border resolves to the `border` token color in dashed style, and that the `:focus-visible` and `prefers-reduced-motion` rules both compiled with the correct selectors and values.

### Acceptance status

- [x] Design tokens centralized (`globals.css`, single source of truth)
- [x] Core primitives render consistently (`Button`, `Card`, `Placeholder` — verified via compiled CSS and a live browser session)
- [x] Desktop example works (`/qr-generator`, verified live); mobile/tablet pass is Module 2.10's dedicated responsive audit, not re-litigated per-module
- [x] No inaccessible low-contrast primary controls (contrast math above; focus-ring corrected after measuring it, not assumed correct)

## Marketing Shell (Header, Footer, Mobile Nav)

Established in Module 2.2. `src/components/layout/{Header,Footer,Logo,MobileNavDrawer}.tsx`, wired into every `(marketing)` route via `src/app/(marketing)/layout.tsx`. `(auth)` and `(dashboard)` do **not** get this shell — auth pages get their own minimal layout (Module 2.5) and the dashboard gets `DashboardSidebar`/`DashboardHeader` (Module 2.6), not the marketing chrome.

### Brand placeholder

"QRForge" — a placeholder name chosen for this module (this project has no fixed brand name yet); trivially renameable without touching the mark. The logomark (`Logo.tsx`) is an original abstract SVG (corner squares echoing a QR finder pattern) — not a reproduction of any real product's logo, per the master build prompt's explicit "do not clone QR.io branding" requirement.

### Header

Desktop: horizontal nav (Generator, Static QR, Dynamic QR, Features, Pricing) + Log in + a primary "Create QR Code" CTA (→ `/qr-generator`, no account required, per the master prompt's UX-improvement list §10.12). Mobile (`< md`): the same links collapse into `MobileNavDrawer`.

### Mobile nav — native `<dialog>`, not a hand-rolled modal

`MobileNavDrawer` uses `<dialog>` in modal mode (`showModal()`) specifically so the browser provides focus trapping and Escape-to-close for free, rather than reimplementing both by hand. What the component _does_ own: open/close React state (synced via the dialog's native `close` event, not just the trigger click, so backdrop-click and Escape both stay in sync), backdrop-click dismissal (checking `event.target === dialogRef.current`), and closing on nav-link click so client-side navigation doesn't leave the drawer open over the new page.

Verified live in a browser (not just read from source): opens via the trigger, moves focus into the dialog automatically, closes via the explicit close button _and_ via a backdrop click, and closing via a nav link both navigates (confirmed via `window.location.pathname`) and closes the drawer in the same interaction. Desktop nav and the mobile trigger were confirmed mutually exclusive at 1280px and 375px viewports via computed `display` values, not just visual inspection. All interactive targets in the drawer are ≥44px (WCAG 2.5.5-style touch target sizing), bumped up from an initial 40px trigger button once measured.

### Footer

Four link groups (Product, QR Types, Resources, Company) plus a copyright line. "Company" links to `/privacy` and `/terms` — two minimal `RouteStub` routes added in this module specifically so the footer has no dead links; their real legal copy is still Module 3.15's job, this module only guarantees the route exists and returns 200. No language switcher, per the master prompt's explicit "don't fake it" instruction — multilingual support isn't implemented.

### Acceptance status

- [x] Header responsive (verified: desktop nav vs. mobile trigger are mutually exclusive by computed style at both viewport sizes)
- [x] Mobile nav accessible (native focus trap + Escape via `<dialog>`; explicit close button; backdrop dismissal; ≥44px touch targets; verified live, not assumed)
- [x] Footer responsive (2-column mobile / 4-column desktop grid, no horizontal overflow at 375px — verified via `scrollWidth` vs. `innerWidth`)
- [x] All visible links point to a valid route from the Module 1.2 map or an intentionally added stub (`/privacy`, `/terms`) — none are dead

## Home Page (`src/app/(marketing)/page.tsx`)

Established in Module 2.3. 11 sections under `src/components/marketing/`, composed in `page.tsx` with no logic of its own (each section is a self-contained component — no giant page component). Original copy throughout, not the master build prompt's example hero text verbatim.

`Hero` → `GeneratorTeaser` (a decorative mock, not the real interactive generator — reusing `QRGeneratorShell` here would duplicate live generation logic on two pages for no benefit; it links to `/qr-generator`) → `TrustStrip` → `StaticVsDynamic` → `FeatureCards` → `QrTypeGrid` → `HowItWorks` → `UseCases` → `AnalyticsPreview` (reuses `AnalyticsChartShell` from Module 1.6, tying the two phases together instead of building a second placeholder) → `FaqTeaser` → `CtaBanner`.

`QrTypeGrid` reads `listQrTypeDefinitions()` directly from the Module 1.3 registry — the "supported types" list is never hand-duplicated; adding/removing a `QRType` updates this page automatically. Brand references introduced in Module 2.2 ("QRForge") were also applied to the root `<title>` for consistency.

### A note on verification limits in this environment

This session's Browser pane does not composite frames (`the Browser pane is not displayed, so the page is not compositing frames` — confirmed via repeated `screenshot` failures and by `getBoundingClientRect`/`offsetTop`/`scrollHeight` all returning degenerate values, e.g. a footer's `offsetTop` reporting `0`). This means **no layout-dependent geometry could be measured this session** — not just screenshots, but overflow checks and element-position checks too. This also retroactively means Module 2.2's "no horizontal overflow, verified via `scrollWidth`/`innerWidth`" claim was weaker evidence than stated: with layout not running, that check would report "no overflow" regardless of whether a real overflow bug existed. It wasn't a false claim about the _feature_ (the CSS itself is standard, reviewed Tailwind responsive utilities with no obvious overflow risk), but it overstated what the _check_ actually proved.

What **is** reliable without a layout pass, confirmed by cross-checking known values against expected ones: `getComputedStyle` for CSS custom-property/cascade resolution (colors, `display`, resolved `@theme` tokens — this is how Module 2.1's contrast/token work was validated) and **breakpoint matching** specifically (a `sm:` media query either matches or it doesn't — independent of box layout). This module leaned on breakpoint-matching checks instead of geometry: confirmed `padding`/`font-size`/`flex-direction` on the hero switch correctly between 375px and 1280px viewports (e.g. `h1` font-size 36px → 48px, CTA row `column` → `row`), which is direct evidence the responsive classes are wired correctly even without pixel measurements. DOM content/structure (`textContent`, element counts, `href` values) and interactive behavior (`.click()`, resulting `window.location.pathname`) were also fully reliable and used throughout.

### Acceptance status

- [x] Clear first-screen action (hero has one primary CTA — "Create a QR Code" — confirmed to navigate correctly)
- [x] Good mobile hierarchy (confirmed via breakpoint-matching: hero padding/type scale/CTA stacking all resolve correctly at 375px)
- [x] No overly tall empty hero (content-driven height only — no forced `min-height`, no decorative filler; can't be measured in pixels this session, but structurally there is nothing that would inflate it)
- [x] Value understandable quickly (headline + one-sentence subhead + immediate CTA, no scrolling required to find the point of the product)
