# Architecture

Status: Phase 2 — UI, COMPLETE (Modules 2.1–2.10, gate passed). Starting Phase 3 — Features. This document grows with each module; sections below marked "TBD" are filled in by their corresponding module.

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
/reset-password    /(auth)/reset-password/page.tsx    (added Module 2.5 — set-new-password state)
/auth/callback     /(auth)/auth/callback/page.tsx      (added Module 2.5 — OAuth/email-confirm loading state)
```

`src/app/(auth)/layout.tsx` (Module 2.5) centers every route in this group with the `Logo` above an `AuthCard` — a second group-specific layout alongside `(marketing)`'s, per Module 2.2's note that `(auth)`/`(dashboard)` don't get the marketing header/footer.

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

`src/app/(dashboard)/layout.tsx` (Module 2.6) is the third and last route-group layout — `DashboardSidebar` on desktop (`md:`+), a compact top bar with `Logo` + a reused `MobileNavDrawer` on mobile. `/dashboard` (Overview) and `/dashboard/qr-codes` (list) are real pages now; the rest (`new`, `[id]` detail/edit/analytics, `files`, `account`, `settings`) remain `RouteStub`s — Module 2.6's scope is layout + overview + list per the master prompt, not the full dashboard surface (Modules 2.7/2.9 own those).

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

## QR Generator UI (`/qr-generator`)

Established in Module 2.4 — the master build prompt calls this "the most important product screen." This module restyles and substantially fleshes out the Module 1.6 `QRGeneratorShell` skeleton; the state model (shell-local state, no global store) is unchanged.

### Icon-based type selector

Added `lucide-react` (v1.31.0 — a major-version-bumped package, newer than most training data; verified all 20 icon export names actually exist in this version before relying on them, via a quick Node `require` check rather than assuming). `src/components/qr/qr-type-icons.tsx` maps each registry `icon` string key to a real `LucideIcon` component — the mapping is the _only_ place UI and domain layer meet; `src/types/qr.ts`/`src/lib/qr/registry.ts` still never import React or an icon library. `QRTypeSelector` renders icon + label + `title` tooltip per option, matching master prompt §2.4's "Icon, short label, selected state, tooltip" spec.

### Real content forms (9 implemented types)

Introduced `react-hook-form` + `@hookform/resolvers/zod` (compatibility with Zod v4 confirmed via `typecheck` before writing all 9 forms, not assumed) so the Module 1.3 Zod schemas now power real inline validation — labels, helper text, and inline errors, per master prompt §2.4's "Content Section" requirements. One form component per implemented type under `src/components/qr/content-forms/`; `sms`/`whatsapp` share a `PhoneMessageFields` internal component since their schemas are structurally identical (phone + optional message), avoiding duplicated JSX for two genuinely-identical field sets. `CONTENT_FORMS` (`content-forms/index.ts`) maps `QRType → form component` for the 9 implemented types only; `QRContentPanel` falls back to an explanatory `Placeholder` for the other 11 (which need Supabase Storage or a landing page before a form makes sense — see "QR Domain Model" above). Each form keeps its own `useForm` instance and pushes raw (possibly-invalid) values up to the shell via `watch(...)` + the existing `content`/`onChange` contract — form state and eventual persisted-record state remain distinct, per the state-ownership rule.

### Working design accordion

`src/components/ui/AccordionItem.tsx` uses the native `<details>`/`<summary>` element rather than a hand-rolled expand/collapse — keyboard toggling (Enter/Space on a focused `<summary>`) is free. The 5 `Design*Controls` components were upgraded from `Placeholder`s to real-looking inputs (color pickers, selects, a range slider, checkboxes) scoped to their `DesignConfig` slice — still not wired to actual QR rendering (Module 3.3), but no longer dashed boxes. Logo upload is a `disabled` file input with helper text explaining it activates once Storage exists (Module 3.8) — an honest disabled state rather than a fake-functional control.

### Preview panel and shell polish

`QRPreviewPanel` now distinguishes an empty state ("Enter content to preview your QR code") from a filled-but-not-yet-rendered state, based on whether any content field has a non-empty string value — still a static brand-motif placeholder, not real rendering. `QRGeneratorShell` gained a working **Reset** button (clears mode/type/name/content/design to defaults) and mode-change logic that falls back to the first type the new mode actually supports (fixing a latent Module 1.6 gap where switching mode could leave an unsupported type silently selected).

### Verification note: this session's Browser pane and a definitive resolution

Manual browser interaction testing in this session's Browser pane (both `next dev` and `next start`, multiple fresh tabs) showed clicks on `QRTypeSelector`/mode-toggle buttons _not_ changing visible state, with zero console errors and DOM `textContent`/`getComputedStyle` otherwise reading correctly. Deep investigation (native event bubbling confirmed working; React fiber/props confirmed attached to `<body>` but absent on every deeper node, including Module 2.2's previously-verified mobile-drawer trigger and even a bare `next/link`) pointed to a session-level Browser-pane/hydration issue **rather than an app bug** — but rather than leave that ambiguous, the question was settled definitively: `@testing-library/react` + `@testing-library/user-event` + `jsdom` were added, and `tests/unit/components/QRGeneratorShell.test.tsx` exercises the exact same interactions (type selection, mode switching, Reset, field-level validation-on-blur) through React's real event system in a real (if headless) DOM — no Browser pane involved. **All 5 tests pass**, which is conclusive: the component logic is correct. The Browser pane behavior in this session should be treated as unreliable for interaction testing going forward (content/structure checks via `textContent` and `getComputedStyle` remain trustworthy, as established in Module 2.3) — component tests are now the reliable fallback for interaction verification, and are worth adding for future modules with real interactive logic, not just as a last resort.

### Acceptance status

- [x] Generator visually complete (real forms, real accordion, polished preview/actions — no bare `Placeholder` boxes left except the 11 not-yet-implemented content types, which is intentional)
- [x] All planned QR-type form states have UI (9 real forms; 11 explained placeholders, not silently blank)
- [x] Design controls have UI (5 sections, real inputs, accordion)
- [x] Preview state exists (empty vs. filled distinguished)
- [x] Loading/error/empty states designed (inline field errors via RHF+Zod; preview empty state; disabled Save/Download until Phase 3 wires them)
- [x] No backend completion required yet (validation is client-side/pure, already available since Module 1.3 — no Supabase, no rendering library, no persistence added)

## Authentication UI

Established in Module 2.5. `src/components/auth/` (`AuthCard`, `LoginForm`, `SignupForm`, `ForgotPasswordForm`, `ResetPasswordForm`) plus two new UI primitives used across all four forms: `PasswordInput` (visibility toggle, `src/components/ui/PasswordInput.tsx`) and `Alert` (`src/components/ui/Alert.tsx`, error/success variants — the "error message area" the master prompt calls for).

### No fake social login

Per master prompt §2.5's explicit instruction, there is no social-auth button anywhere in this module — not even a disabled placeholder. Adding one would misrepresent a capability that doesn't exist and isn't currently planned; when/if it's ever built, it can be added deliberately with its own module.

### Honest not-yet-connected state, not fake success

Every form has real client-side validation (React Hook Form + Zod, same pattern as Module 2.4) and a real loading state (a stand-in `setTimeout` delay, since there's no backend yet), but on completion shows an explicit muted note — _"…isn't connected to a backend yet — arrives in Module 3.1"_ — rather than a fake success message. A form-level `Alert` (the "error message area" requirement) is wired into each component (`formError` state → `<Alert variant="error">`) and ready for Module 3.1 to populate from a real failed request; it doesn't render anything today because nothing has actually failed yet. This was a deliberate choice over faking a success/failure outcome, which would misrepresent what the app can currently do.

### A latent Module 2.4 bug found and fixed here

While wiring `PasswordInput` (which needs to forward a ref to the underlying `<input>` for React Hook Form's `register()`), discovered that `Input`, `Textarea`, and `Select` (Module 2.4) were plain function components, not `forwardRef`-wrapped — passing `ref` explicitly failed a `tsc` check outright. Investigating further: RHF's `{...register(...)}` spread _also_ includes a `ref`, but spreading (vs. an explicit `ref=` attribute) bypasses TypeScript's excess-property check, so Module 2.4's forms passed `tsc` silently while still being subtly broken at runtime — `register()`'s ref never actually reached the DOM input, meaning RHF's error-focus-management (focusing the first invalid field) silently didn't work on any Module 2.4 content form. Fixed by converting all three primitives to `forwardRef`; this is a real behavioral fix, not just a Module 2.5 addition, and required no changes to any form component (the `{...register(...)}` call sites were already correct).

### Verification approach

Following the Module 2.4 finding that this session's Browser pane doesn't reliably reflect click-driven state changes, interaction verification here went straight to component tests rather than re-attempting browser clicks: `tests/unit/components/LoginForm.test.tsx` and `SignupForm.test.tsx` cover inline validation (empty/invalid email, short password, mismatched passwords), the password-visibility toggle, and that a valid submission actually enters the loading state. One genuine flake was found and fixed in the process: an early version of these tests waited (via `findByText`) for the post-submit "not connected" note, which depends on a real 500ms `setTimeout` — under the full suite's parallel test load this occasionally exceeded even a 3-second `findByText` timeout. Diagnosed with a temporary forced-failure assertion that dumped the live DOM (confirming the loading state _did_ activate correctly, immediately), then fixed properly: assert on the synchronous loading-state transition instead of waiting on real wall-clock timing. Confirmed stable across 3 consecutive full-suite runs afterward. Route-level content was spot-checked via `curl` against the production server (SSR HTML contains the right headings/labels for all 5 auth routes) rather than the Browser pane, consistent with the same lesson.

### Acceptance status (master prompt §2.5, adapted — no explicit checklist given)

- [x] Login, Signup, Forgot Password, Reset Password, and Auth Callback states all built
- [x] Clean centered-card layout
- [x] Email/password controls with a password visibility toggle
- [x] Client-side validation with inline errors
- [x] Loading state (real, not just declared — button text/disabled state genuinely changes during the stand-in delay)
- [x] Error message area (wired, currently dormant — nothing has failed yet since there's no backend)
- [x] Links between login/signup/recovery
- [x] No fake social login

## Dashboard UI

Established in Module 2.6. Migrated the Module 1.6 dashboard component skeletons (`DashboardSidebar`, `DashboardHeader`, `QRCodeCard`, `QRCodeTable`, `QRCodeStatusBadge`, `EmptyState`, `AnalyticsSummaryCards`) from their original `gray-*` placeholder classes to the Module 2.1 semantic tokens, and built the layout + two real pages the master prompt's Module 2.6 calls for.

### Mobile nav: reused, not rebuilt

Rather than writing a second drawer, `(dashboard)/layout.tsx` reuses `MobileNavDrawer` (Module 2.2, native `<dialog>`) with the dashboard's own `DASHBOARD_NAV_ITEMS` — the component's `links` prop was already a generic `{label, href}[]` shape. `MobileNavDrawer`'s prop type was widened to `readonly {...}[]` (a compatible, additive change) so a `const`-asserted nav array can be passed directly without re-spreading it into a mutable array. `DASHBOARD_NAV_ITEMS` itself was extracted to `src/components/dashboard/nav-items.ts` so `DashboardSidebar` and the layout's mobile drawer share one source instead of two copies drifting apart.

### Active-link detection: found and fixed a real bug before it shipped

`DashboardSidebar` was converted to a Client Component using `usePathname()` to auto-detect the active item (dropping the `activePath` prop Module 1.6 had every caller pass manually). The first implementation used a naive per-item `pathname.startsWith(item.href)` check — which breaks the moment two nav hrefs share a prefix: `/dashboard/qr-codes` ("QR Codes") and `/dashboard/qr-codes/new` ("Create QR") both start with `/dashboard/qr-codes`, so visiting `/dashboard/qr-codes/new` would have marked **both** links `aria-current="page"` simultaneously. Caught by writing the component test first (asserting only one should be current) rather than by inspection — the naive version failed it. Fixed with `findActiveHref()`: sort nav items by href length descending, return the first (i.e. most specific) whose href exactly matches or is a genuine path-segment prefix (`pathname.startsWith(href + "/")`, not a bare string prefix) of the current path.

### Mock data, not fake persistence

`src/lib/qr/mock-data.ts` exports `MOCK_QR_CODES` (5 entries spanning every `QRCodeStatus`/mode combination) — explicitly commented as Phase 2 UI-only, never imported outside dashboard pages, replaced by real Supabase queries in Module 3.5. The Overview page's "Scans This Period" stat is left as `"—"` rather than a fabricated number, since no time-windowed aggregation logic exists yet — consistent with the "honest, not fake" pattern established in Module 2.5's auth forms.

### Card/table viewport switching: CSS-only, not JS-driven

`/dashboard/qr-codes` renders both `QRCodeTable` (`hidden md:block`) and a `QRCodeCard` grid (`md:hidden`) unconditionally — the browser's own media-query evaluation picks the right one, with no `matchMedia`/resize-listener JS needed. Both are present in the same server-rendered HTML (confirmed via `curl`, not just assumed), so there's no client-side layout shift or hydration-dependent branch.

### Verification approach

Consistent with Modules 2.4/2.5: component tests over Browser-pane interaction testing. `EmptyState.test.tsx` (title/description/action rendering, and that a missing description doesn't leave stray markup) and `DashboardSidebar.test.tsx` (the active-link bug fix above, using `vi.mock("next/navigation")` to control `usePathname()`) — 5 new tests. Route content verified via `curl` against the production server: both `/dashboard` and `/dashboard/qr-codes` return 200 with the expected mock QR names in the SSR HTML, and the table headers are confirmed present in the markup (proving the desktop branch renders, not just the mobile one).

### Acceptance status

- [x] Dashboard layout (sidebar + header, desktop and mobile)
- [x] Mobile sidebar collapses to a drawer (reused `MobileNavDrawer`, not a second implementation)
- [x] Overview screen with stat placeholders and recent QR codes (real component code, mock data)
- [x] QR code list with card/table viewport strategy
- [x] Strong empty state for zero QR codes (component-tested; not visible in the live mock-data demo since the demo data is intentionally non-empty to also prove the list rendering works)

## QR Detail and Edit UI

Established in Module 2.7. `/dashboard/qr-codes/[id]` (detail) and `/dashboard/qr-codes/[id]/edit` (edit) are real now; both look up `MOCK_QR_CODES` by `id` (`src/lib/qr/mock-data.ts`, extended this module with `createdAt`/`destinationSummary` and a `findMockQrCode()` helper) and call `notFound()` for an unknown id.

### A fourth copy of the placeholder graphic → extracted

Before this module, the same corner-square SVG motif existed independently in `Logo`, `QRPreviewPanel`, and `GeneratorTeaser`. The detail page's large preview needed a fourth copy, which was the actual trigger to extract `src/components/ui/QrPlaceholderGraphic.tsx` and refactor the three existing usages to call it — a small, low-risk, additive change (each call site just swapped inline SVG markup for a component call; no behavior changed) directly motivated by this module's own need, not a speculative cleanup of unrelated code.

### Edit page reuses the generator shell, doesn't rebuild a form

Per the master prompt's explicit instruction to reuse generator design/content components for editing, `/dashboard/qr-codes/[id]/edit` renders `QRGeneratorShell` (Module 2.4) rather than a separate edit-specific form. `QRGeneratorShell` gained an optional `variant?: "create" | "edit"` + `initialName?: string` prop pair (defaulting to the original Module 2.4 behavior when omitted, so `/qr-generator` is unaffected):

- **Dirty tracking**: `isDirty` compares every piece of shell state (name, mode, type, content, design) against its initial value. Only `name` is genuinely pre-filled from mock data today — content/design pre-fill needs a real per-QR-code payload/design record, which doesn't exist until Module 3.5, and the edit page says so explicitly via an `Alert`.
- **Unsaved-changes indicator + Save Changes**: shown only in `edit` mode; the button is disabled until `isDirty`.
- **Navigation guard — real, but scoped**: a `beforeunload` listener (added only while dirty) blocks the browser closing/reloading/navigating away via a typed URL — this is genuinely tested (see below), not just declared. **In-app SPA navigation** (clicking another dashboard sidebar link while dirty) is **not** intercepted — the App Router doesn't expose a simple per-navigation confirm hook, and building one is disproportionate to guarding mock data that isn't actually at risk of being lost yet. Documented as a known scope boundary, revisited once Module 3.5 makes losing an edit a real consequence.
- `Reset` now restores `initialName` (not a blank string) in both variants, so "reset" means "discard my edits since the page loaded," which is coherent for `create` (initial name is usually `""`) and `edit` (initial name is the loaded QR's name) alike.

### A documented Next.js constraint, not a bug: `notFound()` returns HTTP 200 here

Visiting `/dashboard/qr-codes/999` (a nonexistent id) correctly renders the `not-found.tsx` UI — but a raw `curl -i` shows `HTTP/1.1 200 OK`, not `404`. Investigated rather than assumed either way: Next.js's own streaming docs (`node_modules/next/dist/docs/01-app/02-guides/streaming.md`, "The HTTP contract") state that once streaming begins — which happens as soon as a `loading.tsx` Suspense fallback renders — the response status is locked in and cannot become a 4xx afterward. `src/app/loading.tsx` (Module 1.1) is a root-level Suspense boundary covering every route including this one, and the detail/edit pages must `await params` (Next 16's async params) before they can know whether the record exists, so `notFound()` is inherently called after streaming has already started. The docs' own recommended fix — call `notFound()` before any `await`/Suspense boundary — isn't available to us here, since knowing _what_ to look up requires awaiting `params` first. Fixing this properly would mean removing or rescoping the app-wide root `loading.tsx`, which is out of this module's scope and would affect every route, not just this one. Left as a known, understood limitation rather than silently claimed as correct.

### Verification approach

6 new component tests in `tests/unit/components/QRGeneratorShellEdit.test.tsx` cover the actually-interactive parts: no dirty indicator/disabled Save Changes before any edit; both appear after an edit; `beforeunload`'s `preventDefault()` fires only when dirty (dispatched manually via `window.dispatchEvent(new Event("beforeunload", { cancelable: true }))` and asserting `event.defaultPrevented`); `Reset` restores the initial name and clears dirty state; `create` mode shows neither Save Changes nor the indicator. Route content verified via `curl` against the production server: detail pages for a dynamic QR (analytics link present) and a static QR (analytics link absent) both render the expected fields; the edit page shows the info note and "Save Changes"; the 404 case's content (not status code, see above) was also verified.

### Acceptance status

- [x] Large QR preview (placeholder graphic, real rendering is Module 3.3)
- [x] Name, status, type, mode, destination/content summary, created/updated timestamps
- [x] Download actions (present, disabled — Module 3.4)
- [x] Edit action
- [x] Analytics summary for dynamic codes only (conditionally rendered, verified for both a dynamic and a static mock QR)
- [x] Destructive actions visually separated (bordered `border-destructive/30` "Danger zone" section, disabled — Module 3.11)
- [x] Edit page reuses generator design/content components (renders `QRGeneratorShell` directly, not a parallel form)
- [x] Unsaved-changes state shown
- [x] Clear Save Changes action
- [x] Confirm navigation if changes would be lost — real for browser close/reload/typed-URL nav (`beforeunload`, tested); in-app SPA navigation intentionally not intercepted yet (documented above, not silently dropped)

## Analytics UI

Established in Module 2.8, at `/dashboard/qr-codes/[id]/analytics` (previously a `RouteStub`). Only shows real analytics for `mode === "dynamic"` QR codes; a static QR code renders an informative `Alert` ("Static QR codes don't track scans...") instead — reachable only by direct URL, since Module 2.7's detail page only links here for dynamic codes.

### What's shown, and what deliberately isn't

The master prompt lists "Unique/estimated unique scans if methodology supports it" as a summary card — **omitted here**, and this is a scope decision, not an oversight: `qr_scan_events` (Module 1.4) stores no raw IP and only an optional salted `ip_hash`, populated solely when a documented legal/product need exists (see the Database Schema section above). With no default per-visitor identifier, there is no honest way to dedupe "unique" scans from the event stream — and the master prompt is explicit: "Do not display analytics metrics that the backend will not actually collect." `src/types/analytics.ts` documents this directly on the `QrScanEvent` type so a future `visitorId`/`isUnique` field isn't added without first adding a real identifier column to back it.

The master prompt's filter list also includes "QR code" — omitted here since this page is already scoped to one QR code by its route; that filter only makes sense on a hypothetical global analytics view, which isn't part of the current dashboard nav (`DASHBOARD_NAV_ITEMS`) or master prompt scope. Date range (24h/7d/30d) and country/device filters are implemented and functional.

### Architecture: pure aggregation vs. mock data, kept separate

`src/lib/analytics/aggregate.ts` holds pure, data-source-agnostic functions (`filterEventsByRange`, `countScansOverTime`, `countByField`, `countByHour`) operating on `QrScanEvent[]` — deliberately separated from `src/lib/qr/mock-data.ts` so this logic is reused unchanged once Module 3.7 wires real `qr_scan_events` rows; only the data source swaps, not the math. All bucketing is UTC-based specifically because this data renders inside a Client Component (`AnalyticsView`, `"use client"`) — a locale-dependent day/hour boundary would make the server-rendered and client-hydrated HTML disagree.

Mock data itself (`MOCK_ANALYTICS_NOW`, per-QR-code `MOCK_SCAN_EVENTS`, `getMockScanEvents()`) lives in `mock-data.ts` alongside `MOCK_QR_CODES`, hand-authored in the same deterministic-array style as the rest of that file (not procedurally generated) — a representative _recent-activity sample_ per dynamic QR code, not a literal 1:1 replay of the existing `scanCount` lifetime totals (482/1204/39) shown elsewhere. `MOCK_ANALYTICS_NOW` is a fixed reference timestamp (`2026-08-12T12:00:00.000Z`) rather than the real current time, so every "last 24h/7d/30d" number stays meaningful and reproducible regardless of when the app is actually loaded — the same reasoning already applied to the plain-string `createdAt`/`updatedAt` dates on `MOCK_QR_CODES`.

A 6th mock QR code ("Referral Program", dynamic, `scanCount: 0`) was added specifically to exercise the _true_ "No scans yet" empty state (master prompt's suggested exact copy), which is distinct from — and rendered differently than — a QR code with real lifetime scans but none inside the currently selected filter window ("Old Flyer Link", archived, all its sample events fall outside every filter range): the former skips filters/charts entirely, the latter still shows filters (the user might want to broaden the range) with each chart individually reporting "No scans in this range".

### Components

- `AnalyticsSummaryCards` (Module 1.6, already token-based, unchanged): Total scans (lifetime, from `qrCode.scanCount`), Last 24h/7d/30d, Top country, Top device — all computed from the _full_ event history regardless of the active filter, so the top-line numbers stay stable while a user explores different date ranges below.
- `AnalyticsFilters` (migrated off Module 1.6's `gray-*` placeholder colors onto design tokens, rewritten from a display-only stub into a real controlled component): date-range buttons (`aria-pressed`) plus country/device `Select` dropdowns, options derived from that QR code's own event data.
- `AnalyticsChartShell` (token-migrated): unchanged empty-state behavior when `children` is omitted (still used exactly as before, with no `children`, by the Module 2.3 marketing homepage teaser) — `AnalyticsView` opts into real content only when data exists for the current filter.
- `BarChart` (new): hand-rolled CSS/flexbox bar chart (no charting library added, consistent with this project's existing hand-rolled SVG assets like `QrPlaceholderGraphic`) — used for both "Scans over time" and "Hour of day", each `role="img"` with an `aria-label` summary and native `title` tooltips per bar.
- `DistributionList` (new): horizontal bar + percentage list — used for country, device type, and OS/browser breakdowns.
- `AnalyticsView` (new, `"use client"`): owns date-range/country/device filter state, derives every aggregate via `useMemo`, and branches between the true-empty state, the range-empty state (each chart independently), and full charts.

### Verification approach

`tests/unit/analytics/aggregate.test.ts` (8 tests) covers the pure aggregation functions directly — range filtering boundaries, zero-filled day buckets, sorted/percentaged distributions, hour bucketing — independent of any UI. `tests/unit/components/AnalyticsView.test.tsx` (5 tests) covers the actual interactive behavior: the true-empty vs. range-empty distinction, summary cards staying constant while switching date ranges, the default 7d range, and the country filter narrowing chart content. Route content spot-checked via `curl` against the production server for a populated dynamic QR (id `1`), a static QR (id `2`, confirms the "doesn't track scans" message and that no chart UI renders), a zero-scan dynamic QR (id `6`, confirms "No scans yet"), and a nonexistent id (confirms the already-documented `notFound()`/200-status behavior from Module 2.7 applies here too, since this page follows the same `await params` → lookup → `notFound()` pattern).

### Acceptance status

- [x] Summary cards: total scans, last 24h/7d/30d, top country, top device
- [ ] Unique/estimated unique scans — deliberately omitted, methodology not supported by the current schema (see above)
- [x] Scans-over-time chart
- [x] Country distribution chart
- [x] Device type chart
- [x] Browser/OS chart
- [x] Hour-of-day breakdown chart
- [x] Date range filter
- [ ] QR code filter — deliberately omitted, redundant on this per-QR-code-scoped page (see above)
- [x] Country/device filters
- [x] "No scans yet" empty state, and a distinct "no scans in this range" state for QR codes with real history outside the current filter

## Account, Files, Settings UI

Established in Module 2.9, replacing the last three `RouteStub`s in the dashboard nav. This module deliberately scoped down from what a full account/files/settings surface could be, per the master prompt's own instructions for it ("initially limit to settings that actually exist", "avoid fake toggles").

### Account (`/dashboard/account`)

`profiles` (Module 1.4) holds `display_name`/`avatar_url`; email lives on `auth.users`, which this app never writes to directly — so `AccountProfileForm` only has one real editable field (display name), with email rendered as a disabled, read-only `Input`. The form itself follows the exact pattern validated in Module 2.5's `LoginForm`/`SignupForm`: real Zod validation, a genuine loading state around a stand-in delay, and an honest `Alert` on completion ("not connected to a backend yet") rather than a fake success. `Avatar` (new, `src/components/ui/Avatar.tsx`) renders an uploaded `avatarUrl` or falls back to initials-on-a-primary-color-circle — general enough to reuse elsewhere later (e.g. a header user menu) rather than a one-off inline element. The password/security entry point is a disabled `Button` with an explanatory note, matching every other pre-Module-3.1 auth-adjacent action in this app.

### Files (`/dashboard/files`)

Mirrors `qr_assets` (Module 1.4): file name, `mimeType`, `sizeBytes` (via a new `formatBytes` helper, `src/lib/utils/format-bytes.ts`), `linkedQrCodeId` (resolved to a QR code name via a `Map` built from `MOCK_QR_CODES`, or "Unlinked"), and `uploadState` (`ready`/`uploading`/`failed`, via `AssetUploadStateBadge`, styled like `QRCodeStatusBadge`). Desktop/mobile rendering reuses the exact dual-render pattern established for the QR codes list in Module 2.6 (`AssetTable` + `AssetCard`, both rendered, CSS breakpoints pick which shows) rather than inventing a new responsive strategy.

**Delete is genuinely interactive, not a disabled placeholder** — a deliberate departure from this app's usual "disable premature actions" convention, because the master prompt explicitly asks for "delete action with confirmation" as a UI element for this module, and Module 2.7 already established the precedent that a real interaction pattern (unsaved-changes tracking) can be built and tested even with no backend behind it. `DeleteAssetButton` opens a native `<dialog>` confirmation (same modal pattern as `MobileNavDrawer`'s drawer), and `FilesView` (new, `"use client"`) owns the asset list in local component state — confirming delete removes the row from that state only. A page reload brings the full mock list back. This is documented here and in the component's own code comment specifically so it isn't mistaken for real persistence: actual Storage object + `qr_assets` row deletion arrives with Module 3.8.

The "Upload file" button is disabled (file upload needs real Storage integration, Module 3.8) with a `title` explaining why, and the empty state (reachable by deleting every mock asset) reuses `EmptyState` from Module 2.6 rather than a new component.

### Settings (`/dashboard/settings`)

Three rows — default QR design, default download format, analytics privacy — chosen directly from the master prompt's own "potential settings" suggestions. Every control is a **visibly disabled** `Select`, not an enabled one that silently does nothing: the master prompt's explicit warning against "fake toggles" is about controls that _look_ functional but aren't, and a disabled control reads as honestly inert rather than deceptively interactive — the same reasoning already applied throughout this app to Download/Save/Archive/Delete actions ahead of their real Phase 3 modules. Each row names the specific module that will wire it up (Module 3.3/3.5 for design presets, Module 3.4 for download export, Module 3.7 for scan-detail collection) rather than a vague "coming soon."

### A jsdom testing gap, worked around locally

`HTMLDialogElement.prototype.showModal`/`.close` are unimplemented in this project's jsdom version (confirmed via a real failing test, not assumed) — `MobileNavDrawer` (Module 2.2) was never covered by a component test for exactly this reason. `DeleteAssetButton`'s confirmation dialog needed to be genuinely tested, so `tests/unit/components/FilesView.test.tsx` polyfills just `showModal`/`close` (toggling the `open` attribute) at the top of that test file — scoped to the file, not a global `vitest.config.mts` `setupFiles` entry, since no other test currently needs it. If a future module adds another `<dialog>`-based component test, consider promoting this polyfill to a shared setup file at that point rather than triplicating it.

### Acceptance status

- [x] Account: display name (editable), email (read-only), avatar, password/security entry point
- [x] Files: file type, size, linked QR codes, upload state, delete action with confirmation
- [x] Settings limited to settings that actually exist, no fake toggles (all controls visibly disabled with a note on what unlocks them)

## UI Phase Audit (Module 2.10)

The full findings, fixes, and reasoning live in `docs/WORKLOG.md`'s Module 2.10 entry (including the "UI Phase Completion Report" section) — this section only records what changed structurally as a result, so it doesn't go stale as a duplicate.

- `/dashboard/qr-codes/new` now renders `QRGeneratorShell` directly (previously a `RouteStub` — a real gap, not an intentional deferral; every "Create QR" link in the dashboard was pointing at a placeholder).
- `QRNameField` composes `FormField`+`Input` like every other form field in the app, instead of a bare, un-tokenized `<input>`.
- `QRModeToggle`'s selected/unselected states now use the same token-based segmented-control styling as `AnalyticsFilters` (Module 2.8), instead of hardcoded `gray-*` classes.
- `RouteStub`, `not-found.tsx`, `error.tsx`, `loading.tsx` migrated off pre-Module-2.1 raw colors onto tokens. `global-error.tsx` is a deliberate exception — it replaces the root layout (and therefore bypasses `layout.tsx`'s `globals.css` import), so it intentionally stays free of any dependency on the app's CSS pipeline, matching Next.js's own minimal example for this exact file.
- `QRCodeTable` (QR codes list) and `AssetTable` (Files) desktop wrappers gained `overflow-x-auto` as a horizontal-overflow guard near the `md:` breakpoint.
- The jsdom `<dialog>` polyfill introduced ad hoc in Module 2.9 (`FilesView.test.tsx`) is now `tests/setup.ts`, loaded globally via `vitest.config.mts`'s `setupFiles` (a no-op outside jsdom), and extended to dispatch the native `close` event so components that listen for it (`MobileNavDrawer`) behave correctly under test. `MobileNavDrawer` — previously untested for exactly this reason — now has real component test coverage.

# Phase 3 — Features

Phase 2's UI phase gate passed (Module 2.10). Phase 3 replaces mock data and disabled/stand-in actions with real Supabase-backed behavior, module by module, per the master prompt's own Phase 3 module list. Nothing in Phase 1/2 is revisited except where a Phase 3 module explicitly requires it (e.g. wiring an existing form to a real backend call).

## Supabase Connection and Authentication (Module 3.1)

The first Phase 3 module — and the first point in this project where a live/hosted Supabase project is genuinely required, per the standing credential-request discipline established at the start of this build. Blocked until the user supplied the project URL and anon/publishable key; a database password and personal access token were requested and supplied separately, later, specifically to push schema migrations to the (brand-new, schema-less) live project — see "Applying the schema to the live project" below.

### Browser/server clients and the protected-route strategy

Follows Supabase's own documented `@supabase/ssr` Next.js App Router pattern exactly, not a custom session scheme:

- `src/lib/supabase/client.ts` — `createBrowserClient()`, used from Client Components (the four auth forms).
- `src/lib/supabase/server.ts` — `createServerClient()`, reading/writing the session via Next 16's async `cookies()`. `setAll`'s `try/catch` is deliberate: it's a no-op when called during a Server Component render (cookies are read-only there by design), which is fine because `proxy.ts` refreshes the session cookie on every request regardless — this is the same caveat Supabase's own docs call out.
- `src/proxy.ts` (Next 16's renamed `middleware.ts`) — **optimistic** check only, exactly per Next.js's own authentication guide: reads the session from the cookie via `getUser()` (which revalidates the JWT against Supabase Auth, unlike the cheaper-but-unverified `getSession()`), redirects an unauthenticated request away from `/dashboard/*`, and redirects an authenticated request away from `/login`/`/signup`. Proxy runs on every request including prefetches, so per Next's guidance it deliberately never touches the database.
- `src/lib/supabase/dal.ts` — `getAuthenticatedUser()`, the **mandatory, database-verified** re-check, `cache()`'d and called from `(dashboard)/layout.tsx`. This is Next.js's own recommended Data Access Layer pattern: the proxy check alone is explicitly documented as insufficient on its own, so every dashboard page load re-verifies server-side rather than trusting the cookie's mere presence.

### Auth forms: real calls, same UX

`LoginForm`/`SignupForm`/`ForgotPasswordForm`/`ResetPasswordForm` (Module 2.5) kept their existing Zod validation, loading-state, and layout exactly as built and tested — only the submit handler body changed, from a stand-in `setTimeout` to a real `supabase.auth.*` call:

- **Login** — `signInWithPassword`, then `ensureProfile()` (idempotent safety net for any account created before this logic existed), then redirects to `?redirectTo=` if present and same-app (`startsWith("/dashboard")`, guarding against an open redirect via a manipulated query string) or `/dashboard` otherwise.
- **Signup** — `signUp` with `emailRedirectTo` pointing at `/auth/callback?next=/dashboard`. If Supabase returns a session immediately (project has autoconfirm on), it upserts the profile and redirects like login; otherwise it shows a "check your email" `Alert` — this project's live config has `mailer_autoconfirm=false`, confirmed directly via the Management API, so the emailed-confirmation path is the one real signups take.
- **Forgot password** — `resetPasswordForEmail` with `redirectTo` pointing at `/auth/callback?next=/reset-password`. Always shows the same generic "if an account exists..." success message on a non-error response, deliberately not confirming or denying whether the address has an account.
- **Reset password** — `updateUser({ password })`, relying on the temporary recovery session `/auth/callback` established from the emailed link; a missing/expired session surfaces Supabase's own error message via the existing `Alert`, no special-casing needed.

All four forms replaced their `formError` dead state (declared but never set, before this module) with a real error path wired to Supabase's actual error responses.

### The callback route: one handler, two link shapes

`src/app/(auth)/auth/callback/page.tsx` (a static placeholder since Module 2.5) is now `route.ts` — a Route Handler, not a page, since it only ever needs to redirect. It handles both shapes a Supabase email link can take depending on project/template configuration: `token_hash`+`type` (verified via `verifyOtp()`) or a PKCE `code` (via `exchangeCodeForSession()`), so it works regardless of how the project's email templates end up configured rather than assuming one. On success it calls `ensureProfile()` and redirects to the `next` query param (validated to be a same-app path, same open-redirect guard as the login form); on failure or missing params, it redirects to `/login?error=confirmation_failed`.

### Profile creation/upsert

`src/lib/supabase/profile.ts`'s `ensureProfile()` does `upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true })` — only `id` is ever written, so it's safe to call idempotently from every entry point that can produce a session (login, signup, the callback route) rather than tracking "is this truly the user's first sign-in" separately. `display_name`/`avatar_url` stay null until a user sets them, which no module currently does — the Account page (Module 2.9) still reads `MOCK_PROFILE`, deliberately left unwired. See "Scope boundary: Account page" below.

### Logout

`src/lib/supabase/actions.ts`'s `logout()` is a Server Action (`supabase.auth.signOut()` then `redirect("/login")`), invoked via a plain `<form action={logout}>` — no client JS required, works via standard form submission. `LogoutButton` (`src/components/dashboard/LogoutButton.tsx`) is used from both `DashboardSidebar` (desktop) and a new `footer` slot on `MobileNavDrawer` (mobile) — `MobileNavDrawer` gained this optional prop rather than hardcoding a logout concept into what's otherwise a generic, marketing-header-reused component.

### Applying the schema to the live project

The user's Supabase project was brand new — none of the Module 1.4/1.5 migrations had been applied to it yet, only validated against local Docker Supabase. Rather than have the user paste raw SQL into the dashboard, they opted to share a personal access token and the project's database password so this could be done directly: `supabase link --project-ref emhsdqfqzdcuexvhweiz` then `supabase db push`, which applied all 8 existing migrations (extensions, 5 tables, RLS policies, storage buckets) cleanly. Both credentials were used only for these two CLI calls and for the read-only verification queries described below — neither is stored anywhere in the repo or `.env.local`.

One additional live-project config change was made, not just schema: the project's default auth redirect allow list only permitted `site_url` (`http://localhost:3000`) itself, not subpaths — which would have silently broken the `/auth/callback` redirect Supabase generates for confirmation/recovery emails. Added `http://localhost:3000/**` to the project's `uri_allow_list` via the Management API. This is a standing, permanent project setting (not a one-off test tweak) and will need a production URL added alongside it once one exists (a known, already-tracked future blocker, not new).

### Live verification (not just mocked component tests)

Component tests (see below) mock `@/lib/supabase/client`, which proves the forms call Supabase correctly but not that Supabase itself is configured and reachable, or that RLS actually allows what the code assumes. Both were verified directly against the live project, using a throwaway test account deleted immediately afterward (cascade-deleted its `profiles` row too — confirmed via a post-cleanup row count):

- **Signup** — real `POST /auth/v1/signup` against the live project: 200, user created unconfirmed (matches `mailer_autoconfirm=false`).
- **Email confirmation simulated** — since clicking a real emailed link isn't reachable from this environment, the test user's `email_confirmed_at` was set directly via SQL (`supabase db query --linked`) to reach the same state a real click would produce, rather than skipping the rest of the flow.
- **Login** — real `POST /auth/v1/token?grant_type=password`: returns a valid session; a deliberately wrong password correctly returns `invalid_credentials` (the exact message the component tests assert on).
- **Profile RLS** — a standalone script using the real `@supabase/supabase-js` package (not curl) signed in as the test user and ran the exact upsert `ensureProfile()` runs; it succeeded, and a follow-up `select` confirmed RLS correctly scoped visibility to only the caller's own row.
- **Password recovery** — real `POST /auth/v1/recover`: accepted (a second attempt minutes later correctly hit Supabase's own email rate limit, which is expected platform behavior, not a bug — and is exactly the kind of error our generic `Alert` error path already handles).
- **Protected-route redirect** — `curl` against the dev server: unauthenticated `/dashboard` → `307` to `/login?redirectTo=%2Fdashboard`; `/login`/`/signup` → `200` (no bounce) while unauthenticated.
- **Login → authenticated dashboard load → session persistence → logout**, in the real Browser pane against the real dev server and the real live project (not mocked): filled and submitted the login form, landed on `/dashboard` with real nav and mock QR data rendering (no console errors); a full page reload while on `/dashboard` stayed authenticated (session persistence); clicking "Log out" redirected to `/login`, and navigating back to `/dashboard` in the same browser afterward bounced to `/login` again — confirming the session cookie was genuinely cleared, not just a client-side redirect.

### Verification approach (automated)

New/updated component tests: `LoginForm.test.tsx`, `SignupForm.test.tsx` (rewritten for the real calls — both now mock `next/navigation`'s `useRouter` and `@/lib/supabase/client`, asserting the exact arguments passed to Supabase and both the success and error-`Alert` paths), plus new `ForgotPasswordForm.test.tsx` and `ResetPasswordForm.test.tsx` following the same pattern. Per the Module 2.5 lesson, mocked Supabase calls that shouldn't resolve during a "still submitting" assertion return a promise that never resolves, rather than depending on real timing. `npm run typecheck`/`lint`/`format:check`/`build` all pass; suite is 103/103.

### Scope boundary: Account page

The master prompt's Module 3.1 objective list is specifically "profile creation/upsert" — not wiring every page that displays profile data. The Account page (`/dashboard/account`) still renders `MOCK_PROFILE` rather than the real signed-in user's email/profile row. This is a genuine gap in the master prompt: no later Phase 3 module is explicitly named for "Account features" the way Modules 3.2–3.17 cover QR generation, dynamic codes, analytics, files, search, etc. Left as-is rather than silently expanding this module's scope; worth the user's attention when convenient (e.g. alongside whichever module next touches dashboard-wide real data).

### Acceptance status

- [x] Browser Supabase client
- [x] Server Supabase client
- [x] Auth session handling (cookie-based via `@supabase/ssr`, refreshed every request by `proxy.ts`)
- [x] Middleware/protected-route strategy (`proxy.ts` optimistic + DAL mandatory re-check)
- [x] Signup (real, live-verified)
- [x] Login (real, live-verified)
- [x] Logout (real, live-verified)
- [x] Password recovery (real, live-verified request flow)
- [x] Profile creation/upsert (real, live-verified against RLS)
- [x] Service-role credentials never requested or exposed client-side (not needed until Module 3.7)

## Static QR Generation (Module 3.2)

Replaces `QrPlaceholderGraphic` in the generator flow with a genuinely scannable QR code, and gives the two disabled download buttons real behavior, for the 9 static types this project already has validated content forms for (Module 1.3/2.4): URL, Text, Email, Phone, SMS, WhatsApp, Wi-Fi, vCard, Event.

### Library choice and the validate-then-build pipeline

Added `qrcode` (npm) — the standard, actively-maintained package for QR image generation in both Node and browser bundles, with `@types/qrcode` for strict-mode TypeScript (the package itself ships no types). No wrapper/React-specific QR library was needed: `qrcode`'s `toString()` (SVG) and `toDataURL()` (PNG) are called directly.

`src/lib/qr/render.ts`'s `buildQrPayload(qrType, content)` is the single gate every consumer goes through: it runs the type's own Zod schema (`definition.fields`, Module 1.3 — never redefined here) via `safeParse`, and only calls the registry's `payloadBuilder` on success. Returns `null` for anything incomplete/invalid, which both `QRPreviewPanel` and `QRDownloadActions` treat identically as "nothing to render yet" rather than each re-implementing validation.

### Preview: real rendering, without preempting Module 3.3

`QRPreviewPanel` now renders the actual generated SVG (`renderQrSvg()`, injected via `dangerouslySetInnerHTML` — safe here since the markup is entirely our own library's output, not user-supplied HTML). A closure/state ordering detail worth calling out: the async render result is stored as `{ payload, svg }`, and the component only uses `svg` when `rendered.payload === payload` at render time — deliberately avoiding a synchronous `setState(null)` inside the effect body to clear stale results, since the React Compiler's lint rule flags that pattern as cascading-render-prone. Checking equality at render time instead needed no state-clearing call at all.

**Scope boundary, stated explicitly in code and here**: only `design.colors.foreground`/`background`/`transparentBackground` are wired into rendering. Dot style, eye shape/color, gradients, frames, and logo overlay all need a custom SVG-matrix renderer, not just an options object passed to `qrcode` — that is genuinely Module 3.3's ("QR Styling and Live Preview Engine") work, not a shortcut taken here. Wiring the two solid colors now (rather than none) was still the right call: leaving already-built, already-visible color pickers with zero effect would be exactly the kind of "looks interactive but isn't" control this project's own Module 2.9 reasoning (no fake toggles) argues against.

### Download: a working default, not Module 3.4's full implementation

`QRDownloadActions` gained real `Download PNG`/`Download SVG` handlers (`renderQrPngDataUrl()`/`renderQrSvg()`, triggered via a temporary `<a download>` element). Module 3.2's per-type acceptance criteria explicitly include "support download," and Module 3.4 ("QR Download and Export") is explicitly about the _full_ experience: resolution presets, complete filename-sanitization policy, logo compositing, transparent-background export nuances, possibly print PDF. To avoid either leaving download non-functional (failing 3.2's own criterion) or quietly doing 3.4's job, this module ships the minimum that makes download real and usable: a fixed 512px PNG width, and `slugifyForFilename()` — a genuinely minimal implementation (lowercase, non-alphanumeric runs collapsed to hyphens, `qr-code` fallback), not the eventual full sanitization/uniqueness policy. `Save QR` stays disabled (Module 3.5).

### Verification

- `tests/unit/qr/render.test.ts` (12 tests): `buildQrPayload` valid/invalid/no-builder-yet cases, Unicode content preserved through the built payload, SVG/PNG rendering succeed without throwing (including a Unicode payload), foreground color and transparent-background options are actually applied to the output, `slugifyForFilename` cases.
- `tests/unit/components/QRPreviewPanel.test.tsx` (3 tests): placeholder shown for empty content; a real `<svg>` renders once content is valid; falls back to the placeholder again if content becomes invalid afterward (exercises the stale-result guard described above, not just the happy path).
- `tests/unit/components/QRDownloadActions.test.tsx` (5 tests): both buttons disabled until content is valid; clicking each triggers a real download with the correct sanitized filename and correct data URL scheme (verified by spying on `document.createElement`/`HTMLAnchorElement.prototype.click`, not just checking the buttons don't throw); `Save QR` stays disabled.
- `npm run typecheck`/`lint` (0 errors, same 8 pre-existing informational warnings)/`format:check`/`build` — pass. Suite: 123/123.
- **Live browser click-through was attempted but not completed this session** — the Browser pane's frame-compositing limitation (previously documented in Module 2.3/2.4) recurred: `read_page`/`screenshot` returned empty/timed out for this route despite `get_page_text`/network/console tools working fine, and simulating a real keystroke via a scripted native-input-value + dispatched `input` event did not reach React Hook Form's `watch()` subscription in this environment (root cause not fully isolated — plausibly a React 19 internals difference from the classic React 16-era "native setter" trick, which predates this project's React version). Rather than either falsely claim a live click-through happened or silently skip verification, this is recorded honestly: the component/unit tests above exercise the real library and real component code paths (including real `userEvent` typing, which is a more faithful interaction simulation than the Browser-pane workaround attempted here), and a production build succeeds and serves the route correctly via `curl`. Genuine live browser verification of this specific flow remains open — worth revisiting if the Browser pane's compositing/environment issue resolves.

### Acceptance status

- [x] All 9 static types: validate required fields (existing Module 1.3 schemas, re-used not re-implemented), build a correct encoded payload, generate a scannable QR, update preview, support download, preserve Unicode
- [x] Every type has at least a valid case, invalid case, and Unicode/special-character case under automated test (payload-builder tests from Module 1.3, plus this module's rendering-level tests)

## QR Styling and Live Preview Engine (Module 3.3)

Makes every control in `QRDesignPanel` actually affect the rendered QR — Module 3.2 only wired solid foreground/background/transparent-background. This is a genuinely custom renderer, not more `qrcode`-library options: pattern/eye shapes, gradients, logo compositing, and frames all need per-module control the library's own `toString`/`toDataURL` don't expose.

### Rendering pipeline: matrix → styled SVG → (optionally) PNG

- `src/lib/qr/matrix.ts`'s `getQrMatrix()` calls `QRCode.create()` (the library's un-rendered form — a raw dark/light module bitmap) and wraps it with `isDark(row, col)` and `isFinderRegion(row, col)`. Finder-pattern (eye) positions are fixed by the QR spec for any symbol size (top-left, top-right, bottom-left, each 7×7), so this needed no data-driven detection — just the known geometry.
- `src/lib/qr/styled-svg.ts`'s `renderStyledQrSvg()` builds the SVG by hand, module-by-module: data modules get their shape from `pattern.dotStyle` (square/dots/rounded); the 3 finder patterns are rendered as two-part shapes (a stroked outer ring sized to the real 7×7 finder geometry, styled/colored by `eyes.cornerSquareStyle`/`Color`, plus a solid inner 3×3, styled/colored by `eyes.cornerDotStyle`/`Color`) — deliberately independent of the data-module fill, so eye colors and data colors can differ (as the existing UI already implied by having separate controls). A gradient (`colors.gradient`), if set, replaces the solid foreground fill with a `<linearGradient>`/`<radialGradient>` reference.
- `src/lib/qr/styled-svg.ts`'s `renderStyledQrPngDataUrl()` derives the PNG from that same SVG (via `Image` + `<canvas>`) instead of re-implementing every shape a second time in canvas draw calls — one rendering pipeline, not two. This intermediate blob URL is created and revoked (`URL.revokeObjectURL`) immediately after the image loads — see "Preview performance" below for why this is the one place an object URL was actually the right tool.

### Reliability rules — implemented as real behavior, not just documented

`src/lib/qr/reliability.ts` holds the rules called out explicitly in the master prompt:

- **Contrast warning**: WCAG relative-luminance contrast ratio between foreground and (effective) background, flagged below `2.5:1` — deliberately lower than WCAG's own `4.5:1` text-legibility bar, since QR scanners tolerate far less contrast than human reading does; the threshold only fires for genuinely risky near-identical colors, not merely "not very pretty" combinations.
- **Safe logo-size limits**: `clampLogoSizeRatio()` clamps to the same `[0.1, 0.3]` range the logo-size slider already used (Module 2.4) — one source of truth, so the UI control and the renderer can't drift apart. A clamp that actually changes the value surfaces as a user-facing warning, not a silent adjustment.
- **Adequate quiet zone**: `MIN_QUIET_ZONE_MODULES = 4` (the QR spec's own recommendation) is applied unconditionally — there's no user control that can shrink it.
- **Sensible error correction when a logo is enabled**: `getRecommendedErrorCorrectionLevel(hasLogo)` returns `"H"` (~30% recoverable) instead of the plain default `"M"` (~15%) whenever `logo.assetUrl` is set, computed automatically — not a user-facing toggle to forget.
- **Fallback if a styling option is unsupported**: the entire custom SVG build runs inside a `try`; on any failure, `renderStyledQrSvg()` falls back to Module 3.2's plain solid-color renderer and returns a warning explaining a simplified version is shown. This is real, exercised behavior (a dedicated test forces the styled path to throw and asserts the fallback fires), not just a comment saying it should happen.
- Per the master prompt's own explicit instruction, none of this guarantees scannability under every extreme combination (e.g. a huge logo _and_ a busy gradient _and_ poor contrast simultaneously) — the safeguards reduce risk, they don't eliminate it.

### Preview performance

- **Debounce**: `QRPreviewPanel` delays the (expensive, async) render by 200ms after the last content/design change via a `setTimeout` cleared on each new change — typing and slider-dragging stay responsive because the debounce only gates the render effect, never the input itself.
- **No full-rerender loops**: the effect's dependency list is `design`'s individual slices (`colors`, `pattern`, `eyes`, `logo`, `frame`), not the whole `design` object, so it only re-fires when a slice that actually affects rendering changes.
- **Object URL cleanup**: used in exactly one place — the SVG→PNG conversion's intermediate blob — and revoked in a `finally` immediately after the image loads (or the attempt fails), verified by a dedicated test. The logo asset itself deliberately does **not** use an object URL (see below), so there's no separate long-lived blob to track/leak.
- **Memory**: `readLogoFile()` (`src/lib/qr/logo.ts`) downsizes any uploaded image to at most 256px on its longest side via a canvas draw before encoding to a data URL — keeps the (eventually DB-persisted, Module 3.5) `design_config` JSONB reasonably small regardless of the original upload's resolution.

### Logo upload: a scope decision revised from Module 2.4/2.9

The logo upload control has been disabled since Module 2.4, with a note that it needed Supabase Storage (Module 3.8). Revisited that assumption here: a **design** logo, unlike a **content** asset (PDF/image/video for file-based QR types, which genuinely is Module 3.8's subject), only needs to exist long enough to be composited into this session's live preview and downloads. It doesn't need server-side persistence until the QR code itself is saved (Module 3.5), at which point `design_config` — including the logo, stored as a data URL — is written as part of that save, the same as every other design field. Storage was never actually a hard requirement for the upload to _work_, only for it to _survive a saved QR code_, which is a later module's concern regardless. Logo upload is real now: `readLogoFile()` reads the file, downsizes it, and returns a data URL; `DesignLogoControls` shows a preview thumbnail and a "Remove logo" action once one is set.

### Frame templates

Three visually distinct styles, matching the existing `Select`'s options (`none`/`simple`/`rounded`/`badge`): `simple`/`rounded` wrap the QR (plus its quiet zone) in a colored border (rounded corners for `rounded`), with an optional bottom bar for `frame.ctaText`; `badge` skips the border entirely and shows only a colored bar with the CTA text below the QR, like a sticker/tag. CTA text is XML-escaped before being placed in the SVG (`escapeXml()`) — necessary correctness/robustness given the SVG is built by string concatenation and then injected via `dangerouslySetInnerHTML`, even though a user typing `<script>` into this specific field wouldn't execute as script through that injection path.

### "Reset design" — a second, more precise reset

`QRGeneratorShell`'s existing "Reset" (Module 2.4) already resets `design` back to `DEFAULT_DESIGN_CONFIG` as a side effect of resetting the whole form (name/content/mode/type too). The master prompt's "reset design" requirement is more precise — the Design panel now has its own "Reset design" button (`QRDesignPanel`) that resets only `design`, leaving name/content/mode/type untouched.

### Verification

- `tests/unit/qr/matrix.test.ts` (5 tests): finder-region geometry, dark-module presence, EC-level-driven size growth.
- `tests/unit/qr/reliability.test.ts` (9 tests): contrast ratio math and warning threshold, logo-size clamping, EC-level recommendation.
- `tests/unit/qr/styled-svg.test.ts` (13 tests): well-formed SVG output; pattern styles produce the right shape primitives; eye colors apply independently of data-module color; gradient defs appear and are referenced; contrast/logo-size warnings fire correctly; logo embeds (or doesn't) correctly; frame border/badge/CTA-escaping/no-frame-chrome cases; the fallback-on-throw path, forced and asserted directly.
- `tests/unit/qr/styled-svg-png.test.ts` (4 tests): PNG data URL produced; the intermediate object URL is created exactly once and revoked exactly once (including on a forced canvas failure — the `finally` still runs); warnings pass through from the underlying SVG render.
- `tests/unit/components/QRPreviewPanel.test.tsx` (+2 tests): a low-contrast design shows the warning inline; a clean design shows the plain "Scan to test." note instead.
- `tests/unit/components/QRDesignPanel.test.tsx` (new, 3 tests): uploading a file produces a preview + "Remove logo" action and calls `onChange` with the right `assetUrl`; removing clears it; "Reset design" restores `DEFAULT_DESIGN_CONFIG` exactly. Uses a small stateful wrapper around `QRDesignPanel` so the test reflects real parent-controlled usage (matching how `QRGeneratorShell` actually wires it) rather than asserting only on the `onChange` call in isolation.
- `tests/unit/components/QRDownloadActions.test.tsx` — extended its jsdom mocking (`Image`, `HTMLCanvasElement.getContext`/`toDataURL`) since the PNG path now goes through the styled SVG→canvas pipeline instead of the `qrcode` library's own Node-compatible PNG encoder.
- `npm run typecheck`/`lint` (0 errors, same 8 pre-existing informational warnings)/`format:check`/`build` — pass. Suite: 159/159.
- No live browser click-through this session either, for the same reason as Module 3.2 (Browser pane compositing issue) — not attempted a second time given the prior session's finding; automated coverage above is the verification record.

### Acceptance status

- [x] Required controls: foreground/background/transparent (Module 3.2) plus pattern style, corner square style, corner dot style, finder colors, gradient, logo upload/use, logo size constraints, logo margin/background, frame templates, frame CTA text, reset design — all real
- [x] Reliability rules: contrast warning, safe logo-size limits, quiet zone, higher EC level with a logo, fallback on unsupported styling — all implemented as exercised behavior, not documentation-only
- [x] Preview performance: debounced renders, no full-rerender loops, object URLs cleaned up, memory kept bounded via logo downsizing, form inputs stay responsive (debounce never blocks typing)

## QR Download and Export (Module 3.4)

Module 3.2 already shipped a _working default_ download (fixed 512px PNG, minimal filename slugification) so downloads were never non-functional. This module is the _complete_ experience the master prompt actually specifies: resolution choice and a real filename policy, plus explicit verification of the acceptance criteria that were previously just assumed to hold.

### Resolution presets

`QRDownloadActions` gained a "PNG size" `Select` (512/1024/2048px, the master prompt's own suggested values; 1024 is the default — a reasonable middle ground between file size and print/screen quality). The value flows straight into `renderStyledQrPngDataUrl(payload, design, pngSize)`'s existing `targetWidth` parameter — no new rendering logic needed, since Module 3.3's SVG→canvas pipeline already scales to any requested width. SVG has no size control: it's vector, so "resolution" doesn't apply — a helper line under the download buttons says so explicitly rather than leaving the asymmetry unexplained.

### Complete filename sanitization

`slugifyForFilename()` (`src/lib/qr/render.ts`) was explicitly documented as a minimal placeholder through Modules 3.2–3.3. Now: Unicode-normalizes (NFKD) and strips combining diacritical marks first — via `\p{M}` with the `u` regex flag, not a hardcoded combining-mark code-point range, so it correctly handles any script's combining marks, not just the common Latin ones — so "Café" contributes "cafe" rather than being silently dropped; untransliterable scripts (CJK, Arabic, etc., which have no ASCII fallback) still collapse to hyphens the same as any other unsupported character, same as before; length is capped at 60 characters. Windows-reserved device names (`CON`, `NUL`, `COM1`, ...) are deliberately **not** special-cased — every call site appends a suffix before the extension (`${filename}-qr.png`), so the literal reserved name can never appear as the actual on-disk filename; adding a check for a case that structurally can't occur would be dead validation, not real safety.

### Acceptance criteria, verified explicitly (not assumed)

- **Logo appears correctly** — downloads already used the same `renderStyledQrSvg`/`renderStyledQrPngDataUrl` pipeline as the live preview (Module 3.3), so this was likely already true; verified directly rather than assumed, including that the logo scales correctly across all three resolution presets (a dedicated test asserts `drawImage` is called with the exact requested width/height at 512, 1024, and 2048).
- **Transparent background behaves as expected** — verified at the SVG level (no background-color fill rect exists at all when `transparentBackground` is set, not merely a transparent-colored one) and relied on the well-established browser guarantee that an unfilled `<canvas>` 2D context defaults to fully transparent pixels, which `toDataURL('image/png')` then preserves as real alpha — noted here rather than asserted by a jsdom test, since jsdom's mocked canvas can't meaningfully verify actual pixel alpha values.
- **QR remains readable after export** — covered by Module 3.3's reliability warnings (contrast, logo-size clamping, EC-level bump), which apply identically to the exported image since it's generated by the same pipeline as the preview that surfaces those warnings.
- **Filename is sanitized** — see above; tested against diacritics, CJK-only input, oversized input, and a bare reserved-device-name string.

### Verification

- `tests/unit/qr/render.test.ts`: extended `slugifyForFilename` coverage (diacritics, CJK-only fallback, length cap, reserved-name-as-input).
- `tests/unit/qr/styled-svg-png.test.ts`: resolution scaling across all three presets (asserted via the mocked canvas's `drawImage` call arguments), logo presence in the exported SVG-derived PNG source regardless of resolution.
- `tests/unit/qr/styled-svg.test.ts`: explicit transparent-background test (no background-color rect at all, not just a transparent-flavored one).
- `tests/unit/components/QRDownloadActions.test.tsx`: PNG size selector defaults to 1024px and the selected size reaches the actual export canvas.
- `npm run typecheck`/`lint` (0 errors, same 8 pre-existing informational warnings)/`format:check`/`build` — pass. Suite: 168/168.

### Acceptance status

- [x] PNG download, SVG download (both real since Module 3.2, extended here)
- [x] Resolution presets: 512px / 1024px / 2048px
- [x] SVG stays vector-based
- [x] Safe, sanitized filenames generated from the QR name
- [x] Downloads work (verified via component tests exercising the real download trigger, not just "doesn't throw")
- [x] Logo appears correctly, transparent background behaves as expected, QR remains readable after export — all explicitly verified, not assumed
- JPEG and print PDF: skipped — the master prompt marks both as optional/conditional ("only if it offers a clear user benefit" / "only if reliably implemented"), and PNG+SVG already cover this app's real use cases

## Saving and Managing QR Codes (Module 3.5)

The first module that writes to `qr_codes`. Everything the generator/detail/edit UI has done since Phase 2 — design, styling, download — now has somewhere real to live, using the schema and RLS policies designed in Module 1.4/1.5 exactly as they were built, with no parallel persistence model.

### Data layer: one mapping, one read path, one write path

- `src/lib/qr/records.ts` — `QrCodeDbRow` (raw snake_case row) → `QrCodeRecord` (camelCase, app-layer; deliberately never carries `user_id` — ownership is an RLS/server concern, not something app code should be passing around) via `toQrCodeRecord()`. `deriveDestinationSummary()` builds a short, human-readable summary directly from `payload_data`'s own fields (not the fully-built encoded payload — a raw vCard or WIFI-string isn't fit for display), reusing the exact field names each type's Zod schema (Module 1.3) already defines. `toQrCodeSummary()` projects a `QrCodeRecord` down to the display-only `QRCodeSummary` shape used by list views.
- `src/lib/qr/queries.ts` — `listQrCodes()`/`getQrCodeById()`, read-only, for Server Components. No explicit `.eq("user_id", ...)` filter is added anywhere — RLS's `qr_codes_select_own` policy already restricts every row to the caller, so a redundant client-side filter would just duplicate a guarantee the database already provides. `getQrCodeById()` returns `null` identically whether a row doesn't exist or exists but isn't the caller's — RLS makes the two indistinguishable at the query level, which is the point: a 404 shouldn't leak whether an id belongs to someone else.
- `src/lib/qr/actions.ts` (`"use server"`) — `saveQrCode`, `updateQrCode`, `duplicateQrCode`, `setQrCodeStatus`, `deleteQrCode`. Every one gets the caller's identity from `supabase.auth.getUser()` server-side and never from client input — the `SaveQrCodeInput` type doesn't even have a `user_id` field, so there's no code path that could accidentally trust one. Content is re-validated server-side via the existing `buildQrPayload()` (Module 1.3's Zod schemas) before any write — the client already validates too, but a server action is a public endpoint regardless of which UI called it.
- `src/lib/qr/action-types.ts` — `SaveQrCodeInput`, `ActionResult<T>`, and the `AUTH_REQUIRED` sentinel live here, split out of `actions.ts` itself. This isn't a style choice: a file with a top-level `"use server"` directive may **only** export async functions — Next's build fails opaquely ("module has no exports") the moment a plain constant is exported alongside them. Caught by running an actual production build, not by typecheck or lint, which is exactly why the build step is part of the module gate and not optional.

### Never storing generated images — regenerating instead

`design_config`/`payload_data` are the only things ever written for a QR's visual — never a rendered PNG/SVG. The QR detail page **server-renders** the real preview by calling `buildQrPayload()` + `renderStyledQrSvg()` (Module 3.3's styled renderer) directly during the page's own render, no client JS needed just to see it; downloads (`QRDownloadActions`, reused as-is from Modules 3.2–3.4) and list-row quick-downloads (`QRCodeRowActions`) regenerate on demand from the same saved config. This is the direct, concrete meaning of "regenerate visuals from saved config, don't store base64 images."

### Dynamic-mode slugs: generated now, resolved later

`qr_codes.slug` is required (and globally unique) for `mode = 'dynamic'` rows per Module 1.4's own check constraint. Actually resolving a slug through `/r/[slug]` is Module 3.6's job, but the identifier has to exist the moment a dynamic QR is first saved — `src/lib/qr/slug.ts`'s `generateRandomSlug()` (8-character random alphanumeric) fills that gap now. `saveQrCode`/`updateQrCode`/`duplicateQrCode` all retry with a fresh slug (up to 3 attempts) on a unique-constraint conflict (Postgres error `23505`) rather than surfacing a raw database error to the user — statistically near-impossible at 36^8 possibilities, but the retry is cheap and turns a theoretical edge case into a non-issue instead of a rare, confusing failure.

### Save flow: one consolidated action, not two

Before this module, both `QRGeneratorShell`'s header ("Save Changes", edit-only, disabled) and `QRDownloadActions` ("Save QR", disabled) implied saving — two buttons for one concept. Consolidated onto `QRGeneratorShell`'s header, the one place that actually owns all the state a save needs (name/mode/qrType/content/design, plus `isDirty`/`variant` already used for the unsaved-changes guard); `QRDownloadActions` went back to being purely about rendering/export, which is what its name says it does.

- **Loading/success/failure feedback**: `saving` state disables the button and swaps its label ("Saving..."); a `savingRef` guard (checked synchronously before any state update) prevents a fast double-click from firing two saves before React re-renders the disabled button — the master prompt's explicit "prevent accidental duplicate submissions."
- **Validation before saving**: the same `buildQrPayload()` gate the preview/download already used; a failed save shows a real `Alert`, not a silent no-op.
- **Unauthenticated save, state preserved**: `/qr-generator` is public and renders the same `QRGeneratorShell`. If `saveQrCode` returns the `AUTH_REQUIRED` sentinel, the current builder state (name/mode/qrType/content/design) is written to `sessionStorage` (`src/lib/qr/draft-storage.ts` — sessionStorage, not localStorage, deliberately: a draft should only survive the current tab's login round-trip, not linger indefinitely) and the user is redirected to `/login?redirectTo=/dashboard/qr-codes/new`. That page checks for a staged draft on mount and restores it into the shell's initial state — a real, working "don't lose my work" flow, not just a redirect that drops it. Reading `sessionStorage` can only happen client-side, after the render that has to match server output, so the one-time `useEffect` read is the correct pattern here (not what the `set-state-in-effect` lint rule's cascading-render concern is actually about); a targeted, justified disable comment documents why.
- **Edit pre-fill, finally real**: `QRGeneratorShell` gained `initialMode`/`initialQrType`/`initialContent`/`initialDesign` props (previously only `initialName` existed, explicitly deferred "until real persistence exists" back in Module 2.7 — this is that moment). `isDirty` and `handleReset` now compare/restore against these real initial values instead of hardcoded defaults. One consequence worth flagging: React Hook Form snapshots `defaultValues` once at mount and doesn't re-read props afterward, so `handleReset` alone wouldn't visually clear an already-mounted content form — `QRContentPanel` is now `key`ed by a counter bumped on Reset, forcing a clean remount. This was a latent, never-actually-exercised gap since Module 2.4 (the original Reset test only checked the name field); worth fixing now specifically because edit-mode Reset discards _real_ saved content, where the mismatch would have been a genuine, confusing bug, not just a cosmetic one.

### Duplicate, archive, delete — one shared component, context-aware

`src/components/dashboard/QRCodeRowActions.tsx` implements all three (plus a quick one-click download), used both on the dashboard list/cards and — with `showDownload={false}`, since the detail page already has the richer `QRDownloadActions` with a resolution picker — on the QR detail page's "Manage" section. One implementation, not two, for the same three actions in both places.

- **Duplicate** always creates a genuinely new row: new UUID (Postgres' `gen_random_uuid()` default), new `created_at`/`updated_at` (the column defaults), a fresh slug for dynamic mode, `status` reset to `active` regardless of the source's status (a duplicate of an archived QR is a fresh, active copy, not a second archived one) — never shares an identifier with the source.
- **Archive** is a plain `status` update (`setQrCodeStatus`), reversible, and is the action surfaced first/more prominently per the master prompt's own preference for "non-destructive archive/status change rather than deletion." The QR list (`/dashboard/qr-codes`) excludes `archived` rows by default; a "Show archived" link (`?archived=1`) reveals them — deliberately minimal (a link + a query param, not a full filter UI), since a real multi-dimension filter/search system is explicitly Module 3.10's job.
- **Delete requires explicit confirmation** (a native `<dialog>`, the same pattern `DeleteAssetButton` established in Module 2.9) and is a real, permanent `DELETE`. Before wiring it, the actual Module 1.4 foreign-key behavior was checked rather than assumed: `qr_scan_events.qr_code_id` is `ON DELETE CASCADE` (a QR's scan history is meaningless without the QR, so it's correct for it to go too) while `qr_assets.qr_code_id` is `ON DELETE SET NULL` (uploaded files survive, they just become unlinked) — exactly the intentional design Module 1.4 already had, used as-is, not reinterpreted.

### Analytics page: an honest empty state, not a broken link

The QR detail page already links dynamic QRs to `/dashboard/qr-codes/[id]/analytics`. That page was still entirely mock-data-driven (Module 2.8), keyed to fake ids ("1"–"6") — every real QR created from this module onward would have hit a confusing `notFound()` there, a real regression this module's own changes would have caused if left alone. Fixed by switching the page to the real `getQrCodeById()` and rendering `AnalyticsView` with a genuinely empty `events: []` array for dynamic QRs — `AnalyticsView`'s existing, already-tested empty-state handling (Module 2.8) renders "No scans yet," which is simply true (no scan tracking exists until Module 3.7) rather than needing a separate "coming soon" message duplicating that UI. `src/lib/qr/mock-data.ts` is trimmed to just `MOCK_QR_CODES`, its only remaining real consumer being the Files page's mock "linked QR code" lookup (Module 2.9), which stays mock until Module 3.8 — `findMockQrCode`/`getMockScanEvents`/`MOCK_SCAN_EVENTS`/`MOCK_ANALYTICS_NOW` were dead code once nothing called them and were removed rather than left to rot.

### Security verification: live, against the real database, not just RLS policies read on paper

A script using the actual `@supabase/supabase-js` package (not curl, not a UI walkthrough) signed in as two separate throwaway accounts and exercised the exact operations `actions.ts`/`queries.ts` perform, directly against the live project:

- User A inserts and reads their own QR — succeeds.
- User B's `select`/`maybeSingle` on User A's QR id returns `null` (not an error) — RLS-blocked and nonexistent are indistinguishable, by design.
- User B's `update`/`delete` on User A's QR affects 0 rows (verified via Postgres' exact row count, not just "no error") — and User A's row is confirmed unchanged/still present afterward.
- User B's list query filtered to User A's `user_id` returns zero rows.
- User A can update, archive, and delete their own QR — all succeed.

11/11 checks passed. Both test accounts and all test rows were deleted immediately after; a follow-up count query confirmed zero rows across `auth.users`/`qr_codes`/`profiles` before moving on.

### Browser verification: honestly partial, not glossed over

A full real-browser click-through of save → list → detail → edit → duplicate → archive → delete was attempted but not completed this session — creating a fresh confirmed test account for it hit Supabase's project-wide email send rate limit (several confirmation emails had already gone out earlier in this same session for the RLS-verification accounts). Rather than skip verification silently or wait out the rate limit indefinitely, this is recorded honestly: the live 2-user RLS check above exercises the real database directly (the security-critical part), and 47 new automated tests exercise every piece of new interactive logic — `QRCodeRowActions` (duplicate/archive/delete/download, including the confirmation dialog and error paths), `QRGeneratorShell`'s save flow (create, edit, validation failure, the unauthenticated-draft-and-redirect path, duplicate-submission prevention), `actions.ts`/`queries.ts` (mocked-Supabase, covering RLS-blocked-as-0-rows explicitly), and `records.ts` (serialization round-trip, regenerating a saved QR). A production build and the full test suite both pass. Genuine live browser click-through remains open for a future session, same as Modules 3.2/3.3.

### Verification

- New tests: `records.test.ts` (10), `actions.test.ts` (14), `queries.test.ts` (7), `QRCodeRowActions.test.tsx` (7), `QRGeneratorShellSave.test.tsx` (5), `QRCodeCard.test.tsx` (4) — 47 new tests total.
- `npm run typecheck`/`lint` (0 errors, same 8 pre-existing informational warnings)/`format:check`/`build` — all pass. The build step caught a real bug (the `"use server"` mixed-export issue above) that typecheck and lint both missed.
- `npm run test` — **215/215 passing**.
- Live verification against the real Supabase project: schema/RLS already existed (Module 1.4/1.5); this module's own read/write logic was exercised directly, live, as described above.

### Acceptance status

- [x] Save a generated QR code, with real loading/success/failure feedback and duplicate-submission prevention
- [x] Give it a name (required — validated both client- and server-side)
- [x] View saved QR codes in the dashboard (real data, empty state included)
- [x] Open a QR detail page (real data, server-rendered regenerated preview)
- [x] Edit supported QR properties (name/mode/type/content/design all genuinely pre-fill and save)
- [x] Duplicate a QR code (new id, new timestamps, never shares identifiers with the source)
- [x] Archive a QR code (non-destructive status change, hidden from the default list)
- [x] Delete a QR code with confirmation (real dialog, real permanent delete, FK behavior used intentionally)
- [x] Download a previously saved QR again (regenerated from saved config, never a stored image)
- [x] Ownership from the authenticated session only — never a client-supplied `user_id`
- [x] RLS-verified live against the real database with two real accounts

## Dynamic QR Codes (Module 3.6)

### The core fix: a dynamic QR encodes this app's own link, never the raw destination

Through Module 3.5, `mode: "dynamic"` was accepted end-to-end (saved, listed, edited) but nothing actually made a dynamic QR's _encoded image_ different from a static one's — both rendered straight from `buildQrPayload(qrType, content)`. That defeats the entire premise of "dynamic": if the printed code encodes the raw URL directly, changing the destination later would require reprinting it, and no scan could ever be counted. The fix is `resolveEncodedPayload(mode, qrType, content, slug)` (`src/lib/qr/render.ts`) — a static QR still encodes its content directly; a dynamic QR always encodes `buildRedirectUrl(slug)` (`src/lib/qr/redirect-url.ts`, `{NEXT_PUBLIC_APP_URL}/r/{slug}`) instead, regardless of content. This one function is now the sole call site used by `QRPreviewPanel`, `QRDownloadActions`, `QRCodeRowActions`'s regenerate-and-download, and the QR detail page's server-rendered preview — there is no second place that could drift out of sync with this rule.

A brand-new dynamic QR has no slug (and so no valid `/r/[slug]` link) until its first save issues one — `QRPreviewPanel`/`QRDownloadActions` show an explicit "Save to generate your scannable dynamic QR code" state in that window rather than rendering nothing, or worse, silently falling back to the raw content.

### Resolving a slug without a client-facing RLS policy

`qr_codes` intentionally has no `anon`/`authenticated` SELECT policy usable for a redirect lookup (Module 1.5's own design — an anonymous scanner must never be able to enumerate or read arbitrary QR rows). Module 1.5's `qr_scan_events` policy comment already anticipated the fix: "a privileged server-side path (service-role key or a SECURITY DEFINER RPC function)." This module picks the RPC function, not the service-role key — `SUPABASE_SERVICE_ROLE_KEY` stays blank in `.env.local`. New migration `20260818120000_add_redirect_rpc_functions.sql` adds two functions, both `SECURITY DEFINER` (run with the owning role's privilege, bypassing RLS) but each exposing only the minimum a redirect needs:

- `resolve_qr_redirect(p_slug text) returns table(destination_url text, status text)` — no row for an unknown slug or a static QR's slug (filtered to `mode = 'dynamic'`); never returns the internal row id.
- `record_qr_scan(p_slug text, p_device_type, p_os, p_browser, p_referrer text)` — keyed by **slug**, not by row id, specifically so a caller can never target an arbitrary internal `qr_code_id` directly (the id is resolved internally, inside the function, from the slug). Atomically inserts a `qr_scan_events` row and increments `qr_codes.scan_count_cached` in one statement. Metadata params exist now so Module 3.7 (Scan Analytics) only has to start passing real values — this module passes `referrer` only; device/OS/browser parsing is explicitly 3.7's job.

Both are `revoke all ... from public` then `grant execute ... to anon, authenticated` — least-privilege, and callable by the actual anonymous visitors who scan a code.

### The `/r/[slug]` route

`src/app/r/[slug]/route.ts`: `export const dynamic = "force-dynamic"` so the route is never statically optimized — every scan re-resolves the slug from the database, so a destination edit (or a pause) takes effect on the very next scan, satisfying the master prompt's "use cache strategy carefully so destination edits propagate correctly" requirement directly rather than by accident. `resolveDynamicQrRedirect()` (`src/server/services/redirect-resolution.ts`, the Module 1.2 stub implemented for real) calls `resolve_qr_redirect`, then defensively re-checks `isSafeRedirectTarget()` (http/https only) even though the `url` QR type's own Zod schema already enforces this at input time — open-redirect defense in depth, not reliance on a single layer, and it's what actually caught the live-verification test's deliberately-inserted `javascript:` destination (see Verification). Missing/invalid slug → 404; paused/archived → 410 (a more precise "no longer available" than a generic 404); resolved and active → 307 to the stored destination. Scan recording is scheduled via `after()` (`next/server`, stable since Next 15) so it happens after the response is sent and never delays the redirect the visitor is waiting on — `after` still runs even though the handler has already returned.

### `destination_url`: denormalized on write, read as a single flat column

The `qr_codes.destination_url` column existed since the Module 1.4 schema but nothing wrote to it until now. `saveQrCode`/`updateQrCode`/`duplicateQrCode` (`src/lib/qr/actions.ts`) populate it directly from the already-validated content payload for dynamic QRs (`resolveDestinationUrl()` — just the built payload, or `null` for static). The reasoning for denormalizing rather than deriving it at redirect time: the redirect route runs through a `SECURITY DEFINER` SQL function with zero access to the app's registry/payload-builder logic, so `destination_url` has to already be a plain column by the time a scan happens. Editing a dynamic QR's content (e.g. changing the URL) re-derives `destination_url` on save while the slug is left untouched — "change the destination without reprinting the code" falls straight out of the existing content-form + Save Changes flow from Module 3.5, deliberately not a second, parallel "set destination" UI.

Only `url` and `whatsapp` currently populate `destination_url` in practice — they're the only `dynamicSupport: true` types with both a real content form and `needsLandingPage: false` in the registry (Module 1.3). The other nine dynamic-capable types (`pdf`, `app`, `images`, `video`, `social`, `multi_link`, `menu`, `feedback`, `audio`) are `needsLandingPage: true` and still have no content form at all (`notYetImplementedQrSchema`) — `buildQrPayload` already returns `null` for them, so `resolveDestinationUrl` naturally stays `null` too, with no special-casing needed. They remain out of scope by construction, not a regression: Module 3.9 owns `landing_page_config` and `/p/[slug]` for exactly this group.

### Pause/Reactivate

`qr_codes.status` (`active | paused | archived`) and its badge styling existed since the UI phase, but nothing could actually set `paused` until now. `QRCodeRowActions` gained a Pause/Reactivate control for dynamic QRs, hidden once a QR is archived (archived already hides it from the default list and the redirect route treats non-`active` identically either way) — it calls the same generic `setQrCodeStatus` action Archive/Unarchive already used since Module 3.5, just with a different target value.

### Security verification: live, against the real database, exercising the actual RPC grants

Direct SQL (via `supabase db query --linked`, an elevated connection) proves the SQL logic works, but not that an actual anonymous visitor — using only the `anon` key, the same client the real `/r/[slug]` route uses — can call these functions at all. So verification ran the real route, not just the SQL:

- Pushed `20260818120000_add_redirect_rpc_functions.sql` via `supabase db push --linked`; confirmed both functions exist with `prosecdef = true` via `pg_proc`.
- Temporarily enabled `mailer_autoconfirm` on the live project (avoids the SMTP rate limit Module 3.5 hit — no confirmation email needs to send) to provision one throwaway confirmed account, used only to satisfy `qr_codes.user_id`'s `NOT NULL` FK.
- Seeded three real rows directly: one `active` dynamic QR, one `paused`, and one `active` QR with its `destination_url` set to `javascript:alert(1)` (bypassing the app's own input-time validation on purpose, to test the redirect-time defense specifically).
- Ran `npm run dev` and drove the real routes through the Browser pane (not curl, not the SQL connection):
  - active slug → real 307 redirect landed on the actual stored destination (verified by the resulting page's origin); `scan_count_cached` and a `qr_scan_events` row both confirmed incremented/inserted afterward, through the `anon`-key path end to end.
  - paused slug → `410 {"error":"inactive"}`.
  - unknown slug → `404 {"error":"not_found"}`.
  - the `javascript:` row → `404 {"error":"not_found"}` — confirms the redirect-time `isSafeRedirectTarget` check is what's actually stopping it, not merely the input-time schema (which this row deliberately bypassed).
  - updated the active row's `destination_url` directly via SQL mid-session and re-requested the same slug immediately after — landed on the new destination with no staleness, confirming `force-dynamic` actually prevents caching rather than just being present in the source.
- Cleanup: deleted all three test `qr_codes` rows and the throwaway auth account, restored `mailer_autoconfirm` to `false`; confirmed `count(*) = 0` on both `qr_codes` and `auth.users` afterward.

### Verification

- New tests (35): `render.test.ts` (+4, `resolveEncodedPayload`), `redirect-url.test.ts` (7), `redirect-resolution.test.ts` (6), `scan-tracking.test.ts` (4), `r-slug-route.test.ts` (5, the route handler directly — 404/410/307 and scan-scheduling via a mocked `after`), `actions.test.ts` (+4, `destination_url` persistence), `QRPreviewPanel.test.tsx` (+2, pending-slug state), `QRCodeRowActions.test.tsx` (+4, pause/reactivate + dynamic-mode download).
- `npm run typecheck`/`lint` (0 errors, same 8 pre-existing informational warnings)/`format:check`/`build` — all pass; `/r/[slug]` confirmed dynamic (ƒ) in the build output, not statically optimized.
- `npm run test` — **250/250 passing**.
- Live verification against the real Supabase project and the real route, as described above.

### Acceptance status

- [x] Create a dynamic QR, set a destination, download it — encodes `/r/[slug]`, never the raw destination
- [x] Later change the destination while keeping the same printed QR code (slug untouched on edit)
- [x] Pause/reactivate a dynamic QR
- [x] `/r/[slug]` resolves efficiently, rejects missing/invalid/inactive cleanly (404/410), records a scan without blocking the redirect, redirects safely, prevents open-redirect abuse (http/https-only, enforced at redirect time not just input time), never exposes an internal database id, and propagates destination edits with no caching
- [x] Slugs are URL-safe, non-sequential, and unique (unchanged from Module 3.5 — `generateRandomSlug()`, DB-unique-constraint-enforced with retry)

## Scan Analytics (Module 3.7)

### Exactly what's collected, and why nothing more

Per scan, on a resolved dynamic QR only: `scanned_at` (timestamp), `qr_code_id`, `device_type`/`os`/`browser` (parsed from the request's own `User-Agent` header — never a third-party lookup), `referrer` (the request's `Referer` header, verbatim), and `country_code` (only when the hosting platform's own edge network provides one — see below). That's it. `ip_hash` (Module 1.4's column) stays unpopulated — there is no documented product/legal need for it yet, and the master prompt's own instruction is "do not persist raw IP by default," which this satisfies by never touching IP at all, not by hashing it. No visitor identifier of any kind is stored, which is also why there's no "unique visitors" metric anywhere in this module — that would require an identifier this schema deliberately doesn't have (see `QrScanEvent`'s own doc comment, Module 2.8).

### Device/OS/browser: parsed locally, not via a dependency

`src/lib/qr/user-agent.ts`'s `parseUserAgent()` is a small, hand-rolled classifier — not a UA-parsing library. The master prompt asks for "device class, OS, browser" as privacy-safe signals, not exhaustive parsing precision, and this project has consistently preferred a small, fully-testable function over a new dependency where one suffices (the hand-rolled charts in Module 2.8 are the same call). Ordering is the only real subtlety and is deliberately tested: Edge's and Opera's own User-Agent strings both contain `"Chrome"` (for site-compatibility reasons going back decades), so Edge/Opera must be checked before Chrome; iOS User-Agent strings contain the literal substring `"like Mac OS X"`, so iOS must be checked before macOS. An unclassifiable device falls back to `"unknown"` (a real `ScanDeviceType` value, not a guess dressed as `"desktop"`).

### Coarse geolocation: a header read, never a geo-IP call

"Coarse geolocation if available and legally appropriate" is implemented as reading whichever edge-network header a hosting platform already attaches for free — `x-vercel-ip-country` (Vercel) or `cf-ipcountry` (Cloudflare), the two most common fronts for a Next.js app (`readEdgeCountryCode()`, `src/app/r/[slug]/route.ts`). This was chosen deliberately over a paid/third-party geo-IP API: it adds zero latency (a header read, not a network call), shares no visitor data with a third party, and is honestly absent — `null`, not guessed — on any hosting that provides neither header, including local development. `QrScanEvent.countryCode` is nullable end-to-end specifically to keep this honest: a country of `null` means "not collected here," never "unknown location for a collected event."

### "Aggregate only where the data genuinely supports it" — not just where a field exists

Every `qr_scan_events` row _has_ a `country_code` column, but on hosting without an edge geo header, every value in it is `null` — technically "the data," but not data that supports a meaningful "scans by country" chart. `AnalyticsView` checks `events.some(hasCountry)` once and, when false, omits the Country filter dropdown, the Country summary card, and the Country distribution panel entirely, rather than rendering a chart that would just say "100% Unknown." Device/OS/browser don't get this treatment — a User-Agent is present on essentially every real HTTP request, so those three are always genuinely supported and always render.

### Efficient queries, deliberately not pre-aggregated

`listScanEvents()` (`src/lib/qr/queries.ts`) is one RLS-scoped query — `.eq("qr_code_id", id).gte("scanned_at", <30 days ago>).order("scanned_at")` — served entirely by the composite `(qr_code_id, scanned_at)` index Module 1.4 already created; no new index needed. The result feeds Module 2.8's existing, already-tested pure functions in `src/lib/analytics/aggregate.ts` (`filterEventsByRange`, `countScansOverTime`, `countByField`, `countByHour`) for total/by-day/by-country/by-device/by-browser-and-OS, rather than five separate SQL `GROUP BY` queries or a rollup table. The master prompt explicitly permits this ("do not prematurely add complexity if raw events are sufficient for expected volume") — this product has no real usage yet, so building rollups/materialized summaries/cached counters now would be optimizing for a scale that doesn't exist. The 30-day bound (the widest range `AnalyticsView`'s own date-range filter offers) keeps the query itself efficient regardless, and keeps every stat on the page internally consistent — nothing implies "all-time" from a query that only ever fetches a window. `scan_count_cached` (Module 3.6, updated atomically by `record_qr_scan`) is still what "Total scans" displays — an all-time count that doesn't need the events themselves at all.

### Redirect performance: unchanged, verified again

Scan recording was already moved off the response's critical path in Module 3.6 (`after()`). This module adds work _inside_ that same deferred callback (UA parsing, an extra RPC parameter) — none of it can delay the redirect, because it never runs before `NextResponse.redirect()` is returned. Headers are still read synchronously in the handler body and only the already-extracted values are closed over by `after()`, unchanged from Module 3.6.

### Privacy disclosure

The master prompt requires analytics be disclosed in the Privacy Policy before production. `/privacy` is still an intentional stub (Module 2.2) with its real legal copy owned by Module 3.15 ("Legal and Privacy Readiness") — writing throwaway disclosure language into the stub now that 3.15 would just rewrite isn't the right call, so instead the stub's own description text was updated to carry the exact list of what's collected forward, so Module 3.15 can't miss it. The full list is documented above, in this section, as the source of truth in the meantime.

### Verification

- New tests (25): `user-agent.test.ts` (12), `scan-records.test.ts` (4, the `qr_scan_events` row mapper), `queries.test.ts` (+3, `listScanEvents`), `scan-tracking.test.ts` (rewritten, 4), `r-slug-route.test.ts` (+2, edge country-header handling), `AnalyticsView.test.tsx` (+1, no-country-data UI).
- `npm run typecheck`/`lint` (0 errors, same 8 pre-existing informational warnings)/`format:check`/`build` — all pass.
- `npm run test` — **272/272 passing**.
- **Live verification against the real Supabase project**: pushed the migration extending `record_qr_scan`; confirmed via `pg_proc` that the old 5-argument overload was actually dropped, not left as unused schema clutter alongside the new one. Provisioned one throwaway confirmed account, seeded one dynamic QR, and drove a real scan through the actual `/r/[slug]` route from the Browser pane with a spoofed `x-vercel-ip-country: US` header (the User-Agent itself was the Browser pane's own real one, not spoofed — Chrome/Windows). The resulting `qr_scan_events` row: `country_code: "US"`, `device_type: "desktop"`, `os: "Windows"`, `browser: "Chrome"`, `referrer` all correct. Logged into the real dashboard as that account and loaded the real analytics page — every number (Total/24h/7d/30d scans, Top country, Top device, all four distribution panels, all three filters) matched that one real event exactly. Cleanup: deleted the test QR (scan events cascade via the existing FK), deleted the throwaway account, restored `mailer_autoconfirm` to `false`; confirmed `count(*) = 0` on both `qr_codes` and `auth.users` afterward.

### Acceptance status

- [x] Real scan-event collection (via the same Module 3.6 `SECURITY DEFINER` path, extended, not a new privileged surface)
- [x] Privacy-minimized metadata: no raw IP, no visitor identifier, country only via a free platform header and never guessed
- [x] Total scans, scans over time, country/device/browser/OS aggregation — country only rendered where the collected data genuinely supports it
- [x] Efficient Supabase queries (one indexed, range-bounded read; no premature rollups)
- [x] Real dashboard analytics wiring (`listScanEvents()` replaces Module 3.5's honest `events: []` placeholder)
- [x] Correct empty/loading/error states (true-empty and range-empty from Module 2.8, unchanged; loading/error from the existing root boundaries)
- [x] `/r/[slug]` redirect performance preserved — scan recording (now doing more work) still runs entirely inside `after()`, verified again live
- [x] No raw IP stored by default
- [x] Live-verified against the real Supabase project with throwaway test data, fully cleaned up afterward

## Account Entitlements — Permanent Pro Account Infrastructure

Not a numbered master-prompt module — an out-of-band operational request (a real, permanent Lifetime Pro owner account, `mts.pk@hotmail.com`) that also required _some_ server-controlled plan concept to exist before it could be granted safely. Built as the minimum needed for that, kept deliberately extensible for real Free/Pro/subscription plans later.

### Why a dedicated table, not `app_metadata`

Two ways to store a plan were considered: Supabase Auth's `app_metadata` (client-unwritable, but only ever writable _by the server_ via the Admin API, i.e. the service-role key), or a normal Postgres table gated by RLS. The table won: it needs no new privileged secret (`SUPABASE_SERVICE_ROLE_KEY` stays blank, same as every other module so far — this project has consistently avoided it), it fits this project's already-established pattern of "RLS decides who can read/write, not application code" instead of a second, parallel authorization mechanism living in Auth's own metadata, and it's far easier to extend later (billing period, `stripe_customer_id`, plan history) than nested JSON in `app_metadata` would be.

### `account_entitlements` — read-your-own, write-nobody

`supabase/migrations/20260819120000_create_account_entitlements.sql`: `user_id` (unique, FK to `auth.users`, cascade-deleted with the user), `plan` (`free`/`pro`), `is_lifetime`, `expires_at` (nullable — null means "does not expire"; a check constraint forbids `is_lifetime = true` with a non-null `expires_at`, so the two fields can't disagree). RLS enables exactly one policy: `select` for `auth.uid() = user_id`. There is **no insert/update/delete policy for any role** — not "authenticated users can update their own row with a restricted column list," which is a much weaker guarantee and easy to get subtly wrong (e.g. forgetting to exclude `plan` from an otherwise-reasonable "update your own settings" policy) — but no write path from the client at all. A missing row means "free" by convention (`getMyEntitlement()`, `src/lib/account/entitlements.ts`) — there's no signup trigger creating a default row, since "no row" already means exactly the right thing.

Verified live, not just by reading the policy: signed in as the real permanent account and attempted to update its own `plan` to `'free'` — the client call returned no error but affected 0 rows (RLS silently filters non-matching rows rather than erroring, standard Postgres RLS behavior for a missing policy). Signed in as a second, unrelated account and attempted to read the permanent account's entitlement (0 rows returned — indistinguishable from nonexistent, same pattern used everywhere else in this schema), update it (0 rows affected), and insert a `pro` row for itself directly (this one _does_ error — `INSERT`'s `WITH CHECK` clause rejects outright rather than silently filtering). Every attempt failed to change anything, from every angle tested.

### The permanent account

`mts.pk@hotmail.com` — Lifetime Pro owner account. Created via the same `mailer_autoconfirm` toggle-and-restore technique as every throwaway verification account this session (Module 3.6/3.7), the only difference being this one is never deleted. Its `account_entitlements` row was written directly via privileged CLI access (`plan = 'pro'`, `is_lifetime = true`, `expires_at = null`) — the same "only a direct, privileged database operation can grant/change an entitlement" rule the RLS policy above enforces for everyone else. Its plaintext password exists only in Supabase Auth's own password store; it was never written to any file in this repository (a temporary provisioning script lived only in the session scratchpad and was deleted before this commit — `git grep` for the password string returns nothing).

### UI

`/dashboard/account` gained a small "Plan" card showing `Free`/`Pro`/`Lifetime Pro` (`planLabel()`) for whoever is actually signed in — real end-to-end via `getMyEntitlement()`, independent of the rest of that page's still-`MOCK_PROFILE`-driven content (a known, already-documented gap from Module 3.1, unrelated to this addition). No billing UI, no upgrade flow, no plan-selection form — the master prompt for this request was explicit that a full billing system isn't in scope, only "the minimum secure entitlement infrastructure required... and future plan checks."

### Verification

- New tests: `entitlements.test.ts` (7) — free-for-unauthenticated, free-for-missing-row, real pro/lifetime mapping, free-on-query-error, and `planLabel()`'s three label cases.
- `npm run typecheck`/`lint`/`format:check`/`build` — all pass (folded into the same verification pass as Module 3.7 below).
- **Live verification against the real Supabase project**: account created and confirmed (`confirmed_at`/`email_confirmed_at` both set), `profiles` row present, `account_entitlements` row present with the exact required values, login with the real password succeeds, logout-then-login-again succeeds, and all four RLS-bypass attempts above failed exactly as intended. Confirmed a second time, after all Module 3.7 test-data cleanup ran, that the account/profile/entitlement were all still fully intact — cleanup queries never touched anything but the specific throwaway ids created for that module's own verification.

## Dynamic QR Quota — Unlimited for the Permanent Account

A follow-up out-of-band request: the permanent account needs to create dynamic QR codes with no plan-level cap, enforced server-side (never a frontend `if (user.email === ...)` special case), extending the entitlement system above rather than building a second one.

### Schema: `dynamic_qr_limit`, NULL is the domain value for "unlimited"

`supabase/migrations/20260819150000_add_dynamic_qr_limit.sql` adds `account_entitlements.dynamic_qr_limit integer` (nullable, `check (dynamic_qr_limit is null or dynamic_qr_limit >= 0)`). `NULL` means unlimited — an explicit domain concept, not a magic sentinel like `-1` or `999999999`, so no call site needs a special case to recognize "no limit." The implicit "free" entitlement (no row at all — see above) also resolves `dynamicQrLimit: null` for now: **no commercial free-tier cap has been decided anywhere in this project**, so introducing a real numeric limit for ordinary users would be inventing a product decision, not implementing one. The enforcement mechanism below is fully real and fully wired; there is simply nothing configured yet for it to restrict, by design, until a future pricing decision sets a finite limit on some plan.

### The resolver: one pure function, one server-side call site

`resolveDynamicQrAllowance(entitlement, currentCount)` (`src/lib/account/entitlements.ts`) is a pure function — `{ allowed, limit }` — with no I/O, trivially unit-testable including the "very high count against an unlimited entitlement" case the request specifically asked not to test by inserting real rows for. `checkDynamicQrAllowance()` (`src/lib/qr/actions.ts`) wraps it with the actual DB reads: it reads the caller's entitlement, and **only queries the current dynamic-QR count when the limit is finite** — skipping a query entirely for the common (today: universal) unlimited case, per the request's own "count applicable existing Dynamic QR codes only if the plan has a finite limit" instruction.

This is called from every place a dynamic QR row can newly come into existence:

- `saveQrCode` — creating a new dynamic QR.
- `updateQrCode` — **only** when the edit is what actually converts an existing static QR to dynamic (`existing.mode !== "dynamic" && input.mode === "dynamic"`). An already-dynamic QR being merely edited never re-triggers the check — blocking edits to a QR you already own because you're "at your limit" would be pointless and hostile, not a real quota concern.
- `duplicateQrCode` — duplicating a dynamic QR creates a new dynamic row, consuming a slot exactly like a fresh save.

The client never decides any of this — `saveQrCode`/`updateQrCode`/`duplicateQrCode` are Server Actions, and the generator UI has no pre-emptive quota logic of its own. A rejection surfaces through the exact same generic `saveError` `Alert` the shell already uses for validation failures (Module 3.5) — no new "upgrade" UI, no disabled Create button, no quota-exceeded modal, per the request's explicit "do not show an upgrade prompt/disable Save/show quota errors preemptively for this account" instruction (which, since nothing has a finite limit configured today, currently applies to every account, not just the permanent one).

### Active + paused count against a finite limit; archived doesn't

Documented choice, since the request explicitly asked for one: `countDynamicQrCodes()` (`src/lib/qr/queries.ts`) counts dynamic QRs with `status != 'archived'` — active **and** paused both count, only archived is excluded. Archiving is already this app's documented, non-destructive "free up room" mechanism (Module 3.5's dashboard-list-hiding behavior) and it does double duty here rather than inventing a second "this doesn't count" concept. A paused QR still physically exists and could be reactivated at any moment, so letting it silently stop counting would let a finite-plan account exceed its real limit just by pausing everything. This distinction is irrelevant to the permanent account specifically (its limit is `null`, so counting never runs at all regardless of how many QRs are active/paused/archived) but was verified live for a finite-limit account regardless (below).

### UI: no fake progress bar

`/dashboard/account`'s Plan card gained a "Dynamic QR codes" row: `Unlimited` when `dynamicQrLimit === null`, otherwise `{count} / {limit}`. Never renders a `5 / 100`-style meter for an unlimited account, per the request's explicit instruction.

### Verification

- New tests: `entitlements.test.ts` (+4, `resolveDynamicQrAllowance` — under/at/over a finite limit, and unlimited with a very high count, all mocked — no thousands of real rows inserted), `actions.test.ts` (+6 across `saveQrCode`/`updateQrCode`/`duplicateQrCode` — finite-limit reject, finite-limit allow, unlimited skips the count query entirely, mode-conversion-only triggers the check, already-dynamic edits don't re-check), `queries.test.ts` (+3, `countDynamicQrCodes`).
- `npm run typecheck`/`lint`/`format:check`/`build` — all pass.
- `npm run test` — **293/293 passing**.
- **Live verification against the real Supabase project, driving the actual `saveQrCode` Server Action** (not just direct SQL): the Browser pane's client JS wasn't compositing this session on the generator page (the same known, previously-documented limitation from earlier modules) — rather than fake a manual click-through, a temporary, uncommitted Route Handler was added that called `saveQrCode` directly inside a real Next.js request (so `cookies()`/RLS/the real session all applied genuinely), invoked via `fetch()` from the one page that _did_ render, and deleted before this commit (confirmed via `git status` — no trace remains).
  - A throwaway account with `dynamic_qr_limit = 1`: first dynamic QR created successfully; a second was rejected with the real user-facing limit message; archiving the first freed the slot (a third create then succeeded); pausing the new one still counted against the limit (a fourth create was rejected again) — confirms the active+paused-counts/archived-doesn't design live, not just in mocks.
  - The permanent account: created two dynamic QRs back to back with no rejection, proving the unlimited path live.
  - Client-side tampering: the throwaway account's own attempt to set its `dynamic_qr_limit` to `null` affected 0 rows; its attempt to set the permanent account's `dynamic_qr_limit` to `0` also affected 0 rows — RLS's zero-write-policy design (above) already covers the new column with no additional policy needed.
  - `/r/[slug]` and scan analytics both re-verified working unchanged: one of the permanent account's new test QRs was fetched through the real redirect route and produced both a real 30x redirect and a real `qr_scan_events` row.
  - Cleanup: all test QR codes (both accounts) and the throwaway account deleted; confirmed afterward that exactly one `auth.users` row remains (the permanent account) and `qr_codes` is empty.

### Acceptance status

- [x] `mts.pk@hotmail.com` has unlimited Dynamic QR codes — no count/monthly/yearly cap, no expiry, no subscription dependency
- [x] Enforcement is entirely server-side (Server Actions); no frontend email-based special case anywhere
- [x] Reusable for future finite plans — the exact same resolver and call sites work correctly for any finite `dynamic_qr_limit`, verified live with a real throwaway account
- [x] Active + paused Dynamic QRs count against a finite limit; archived does not — documented and live-verified
- [x] Paused/archived QRs never reduce the permanent account's availability (moot for it specifically, since its limit is `null`)
- [x] Dashboard shows "Unlimited" for this account, never a fabricated `x / y` meter
- [x] Generator UI shows no upgrade prompt, disabled Save, or quota error for this account
- [x] Browser cannot set `dynamic_qr_limit`/`is_lifetime`/`plan`; RLS confirmed live for both self- and cross-user attempts
- [x] No security control weakened — open-redirect/URL-safety checks, RLS elsewhere, and rate limiting (none added, none removed) are all unrelated and untouched
- [x] Live-verified against the real Supabase project with throwaway test data, fully cleaned up; permanent account confirmed intact throughout and afterward

## File-Based QR Types and Supabase Storage (Module 3.8)

### The core design decision: no service-role key

The user's instruction for this module was explicit: don't assume the service-role key is required for signed URLs; first try the authenticated-user/RLS path; only ask for the key with a specific justified operation. That path worked end to end, so `SUPABASE_SERVICE_ROLE_KEY` is still blank.

The obstacle: a signed URL (or any `select` on `storage.objects`) is itself gated by an RLS policy on `storage.objects`. The Module 1.5 policies only grant the **owner** read/write within their own `{user_id}/` folder — correct for a private asset, but a dynamic QR's file needs to be readable by an anonymous visitor who scanned the code, not just the owner. A plain RLS policy can't express "readable by anyone, but only if the owning QR is `dynamic` and `active`" without joining `storage.objects` against `qr_assets`/`qr_codes` — and a plain subquery inside a policy's `USING` clause runs as the **calling** role, so for an anonymous caller it would hit `qr_assets`/`qr_codes`'s own RLS (no anon `select` policy on either) and silently evaluate false.

The fix, migration `20260819180000_add_public_asset_read_policies.sql`: a `SECURITY DEFINER` SQL function, `qr_asset_is_publicly_readable(bucket, path)`, that internally joins `qr_assets`→`qr_codes` and returns true only when `qr_codes.mode = 'dynamic' and qr_codes.status = 'active'`. `SECURITY DEFINER` lets the function's own body bypass `qr_assets`/`qr_codes` RLS (it runs as the function owner), while the **policy itself** still only grants `select` to `anon`/`authenticated` roles and only for the three file-carrying buckets (`qr-documents`, `qr-gallery`, `qr-media` — `qr-logos` deliberately excluded, logos are only ever composited server-side into a rendered QR image, never served standalone). This is the same pattern Module 3.6 established for `resolve_qr_redirect` — a narrow, purpose-built privileged function instead of a service-role key — just used from inside a Storage policy instead of called directly from app code. The existing Module 1.5 owner-only CRUD policies are untouched; this migration only **adds** a policy, it never relaxes one.

A second function, `resolve_landing_page(p_slug)` (migration `20260819180100_add_resolve_landing_page.sql`), mirrors `resolve_qr_redirect` for the `/p/[slug]` page: returns `qr_type`/`status`/`payload_data` for a `dynamic` QR by slug, letting the landing page resolve without a client-facing `select` policy on `qr_codes`.

**A side benefit that fell out of this design for free**: pausing or archiving a dynamic QR immediately revokes both `createSignedUrl()` (the `USING` clause re-evaluates on every call, `qr_codes.status` no longer `active`) and the landing page (`resolve_landing_page` only returns rows for `mode = 'dynamic'`, and the page itself renders a "not active" message for a non-`ok` resolution). There's no separate "is this QR still active" check needed anywhere in the file-serving or landing-page path — the same RLS policy that grants access is what revokes it.

Both functions were validated live via direct RPC/`createSignedUrl` calls against a seeded row **before** any application code was written — confirmed an anon caller could resolve an active QR's landing page and generate a working signed URL, then confirmed pausing the QR immediately broke the signed URL (`Object not found`) while `resolve_landing_page` correctly kept reporting `status: "paused"`.

### The four new QR types

`pdf`, `images`, `audio`, `video` all move from `notYetImplementedQrSchema` to real Zod schemas (`src/lib/validation/qr/{pdf,images,audio,video}.ts`) and real payload builders (`src/lib/qr/payload-builders/{pdf,images,audio,video}.ts`), registered in `src/lib/qr/registry.ts`. Three of them (`pdf`/`images`/`audio`) store a Storage path in `payload_data` — deliberately not `landing_page_config`, which is reserved for Module 3.9's non-file hosted types (social/multi-link/menu/feedback). Their payload builders exist only so `buildQrPayload` returns non-null once a real upload has completed (what `validateSaveInput` checks) — the actual QR image never encodes a Storage path directly; it encodes `/p/[slug]` like every other landing-page type.

`video` is the odd one out: `staticSupport: true` and `needsStorage: false` (unlike the other three, which are dynamic-only and Storage-backed). A static video QR encodes the raw external URL (YouTube/Vimeo/etc.) directly — the master prompt explicitly prefers linking an external host over self-hosting video. A dynamic video QR wraps the same URL in a hosted landing page (embed where recognized, plain link otherwise), same as the file types.

`resolveEncodedPayload` (`src/lib/qr/render.ts`, Module 3.6) now branches dynamic-mode encoding on `getQrTypeDefinition(qrType).needsLandingPage`: `/p/[slug]` (`buildLandingPageUrl`) for the four new types, `/r/[slug]` (`buildRedirectUrl`) for everything else, unchanged. Static mode is untouched — `buildQrPayload` directly — so static video still encodes its raw URL, never `/p/`.

### Upload, sync, and cleanup

`src/lib/qr/asset-upload.ts` (`"use client"`) uploads directly from the browser to Storage using the visitor's own authenticated session — no server round-trip, permitted by the existing Module 1.5 owner-scoped `insert` policies. Client-side size/type checks here are for immediate UX feedback only; the bucket's own `file_size_limit`/`allowed_mime_types` (Module 1.5) are the real, server-enforced boundary.

`src/lib/qr/asset-sync.ts`'s `syncQrAssets()` runs after every `saveQrCode`/`updateQrCode` for a `needsStorage` type: extracts the current asset-path set from the validated content, diffs it against the existing `qr_assets` rows for that QR, removes stale ones (both the real Storage object and the `qr_assets` row), and upserts the current set. `deleteQrCode` was extended the same way — before deleting the `qr_codes` row (which only `SET NULL`s `qr_assets.qr_code_id`, not `CASCADE`s), it fetches the QR's assets, deletes the row, then removes each real Storage object and its `qr_assets` row.

### `/p/[slug]` (real now, not deferred to 3.9)

`src/app/p/[slug]/page.tsx` was a Module 1.2 stub explicitly deferring to "Module 3.9" — corrected here, since Module 3.8's own PDF/gallery/audio landing-page requirements make it necessary now; Module 3.9 extends the same page/resolver for the non-file types, it doesn't build a second mechanism. `resolveLandingPage(slug)` → `not_found` (`notFound()`), `inactive` (a plain "not active" message, no signed URLs attempted), or a real render switched on `qrType` (`PdfLandingPage`/`GalleryLandingPage`/`AudioLandingPage`/`VideoLandingPage`, `src/components/landing/`). The three Storage-backed landing components are async Server Components generating signed URL(s) server-side (`src/lib/qr/signed-asset-url.ts`'s `createSignedAssetUrl` — wrapped in try/catch, never throws, `null` on any failure, each caller renders a "not available" fallback rather than an error page). `VideoLandingPage` re-validates the stored URL through the same `isSafeRedirectTarget` check `/r/[slug]` uses (defense in depth on top of the `url`-schema-style validation the content already went through at save time).

### Files page: real data

`src/lib/files/queries.ts` (`listQrAssets`) and `src/lib/files/actions.ts` (`deleteQrAsset`) replace the Module 2.9 mock. `deleteQrAsset` mirrors the exact same Storage-object-then-row deletion order `deleteQrCode` already uses. No "in use by an active QR" guard on delete — deliberately simple; a landing page missing its asset already degrades to its own "not available" state. The standalone "Upload file" button was removed — uploads only happen through a QR's own content form now, not a separate Files-page flow. `src/lib/qr/mock-data.ts` and `src/lib/files/mock-data.ts` are deleted (confirmed zero remaining consumers first).

### Verification

- New tests (54, taking the suite from 293 to 347 across 55 files): `pdf.test.ts`/`images.test.ts`/`audio.test.ts`/`video.test.ts` (schemas + payload builders + `toEmbeddableVideoUrl`), `asset-upload.test.ts` (upload success/oversized/wrong-type/unauthenticated/Storage-error), `asset-sync.test.ts` (upsert/replace/clear/no-op-for-non-storage-type/gallery multi-asset/gallery reorder/audio-bucket), `landing-page-resolution.test.ts` (mirrors `redirect-resolution.test.ts`), `signed-asset-url.test.ts` (success/RLS-blocked/throws-internally, all → non-throwing null on failure), `render.test.ts` (+2, `/p/` vs `/r/` branching), `registry.test.ts` (all four types added to `IMPLEMENTED_TYPES`), `actions.test.ts` (`deleteQrCode` Storage-cleanup path), `files/queries.test.ts`, `files/actions.test.ts`, `FilesView.test.tsx` (rewritten for the real `deleteQrAsset` action).
- `npm run typecheck` / `npx eslint .` (0 errors, same 9 pre-existing `react-hooks/incompatible-library` warnings on every React-Hook-Form content form, unrelated to this module) / `npx prettier --check .` — all pass.
- `npx vitest run` — **347/347 passing** across 55 files.
- `rm -rf .next && npm run build` — pass; `/dashboard/files` and `/p/[slug]` both build as dynamic (`ƒ`) routes, no `/api/test-only-*` routes present in the output.
- **Live verification against the real Supabase project** (both migrations pushed via `supabase db push --linked`; confirmed both functions exist with `prosecdef = true` before writing any app code): using a throwaway confirmed account (`mailer_autoconfirm` toggle, same technique as Modules 3.6/3.7) and the temp-route technique (Browser pane client JS wasn't compositing this session) to drive the real `saveQrCode`/`updateQrCode`/`deleteQrCode` Server Actions:
  - **PDF**: real upload → real save (slug assigned, `destination_url` stays `null`, a real `qr_assets` row created) → anonymous `/p/[slug]` render with a working signed URL serving the correct PDF bytes → pausing the QR immediately shows "not active" and breaks the signed URL → replacing the file removes the old Storage object **and** the old `qr_assets` row while the new file becomes accessible → cross-user reads succeed (intended — public), cross-user writes/deletes affect 0 rows → deleting the QR removes both the Storage object and the `qr_assets` row.
  - **Gallery**: 2 images with captions, same save/render/pause/delete cycle, confirmed multi-asset cleanup removes both Storage objects and both `qr_assets` rows on delete.
  - **Audio**: title/description, real file serving through the signed URL, same cycle.
  - **Video**: both the dynamic (wrapped in `/p/[slug]`, embed for a recognized YouTube URL) and static (raw URL encoded directly, no landing page, no Storage) paths confirmed.
  - All test data and the throwaway account deleted afterward; confirmed via `count(*)` that only the permanent `mts.pk@hotmail.com` account and zero test `qr_codes`/`qr_assets`/Storage objects remained.
  - **Files page's own `listQrAssets`/`deleteQrAsset` path specifically** (as opposed to the save/landing-page/delete flow above) was **not** separately driven through the browser this pass: a fresh signup for that check hit Supabase's mandatory email-confirmation gate, and this session had no `SUPABASE_ACCESS_TOKEN` available to re-run the `mailer_autoconfirm` Management-API toggle (it's a session-only value, never persisted — see `docs/SESSION_HANDOFF.md`). Rather than block the whole module on that, this relies on: (a) `listQrAssets`/`deleteQrAsset` are thin wrappers over the exact same `qr_assets`-row-plus-Storage-object read/delete already live-verified four times above, (b) 8 passing unit tests (`files/queries.test.ts`, `files/actions.test.ts`, `FilesView.test.tsx`) covering the mapping and both the success and RLS-blocked (0-rows-affected) delete paths, and (c) `FilesView`'s delete flow reuses the identical `router.refresh()`-after-Server-Action convention already live-verified for `QRCodeRowActions`. A harmless unconfirmed test signup (`qrforge.module38.filesverify@gmail.com`) was left in `auth.users` — never confirmed, so it can never authenticate or own any data; flagged in the handoff for a future session with Management API access to either confirm-and-verify or delete.

### Known issues

- None blocking. Audio artwork upload was explicitly scoped out (would need a second bucket for a single-type QR) — a small, additive follow-up if ever needed, not a redesign.
- `duplicateQrCode` on a file-based type does not copy the underlying Storage object — the duplicate shares the original's path until either QR is next edited (which re-syncs assets independently). Accepted, documented trade-off, not silently shipped.
- One 13-byte orphaned Storage blob remains from this module's pre-app-code RLS smoke test (its owning throwaway user was deleted first) — direct SQL deletion of `storage.objects` is blocked by a `protect_delete()` trigger, and it's already fully unreachable (no matching `qr_assets`/`qr_codes` row, so the new public-read policy can never match it either), so it wasn't worth escalating to the service-role key to remove.
- The Files page's dedicated browser-driven verification (as opposed to the equivalent unit-test/shared-mechanism coverage) is still deferred — see the Verification section above for what covers the gap. The harmless unconfirmed leftover signup this gap produced (`qrforge.module38.filesverify@gmail.com`) was cleaned up in Module 3.9 once `SUPABASE_ACCESS_TOKEN` was available again.

## Hosted Landing Page QR Types (Module 3.9)

### Scope: which types, and why `app` changed from Module 1.3's default

The master prompt's own §3.9 list (Social Links, Multiple Links, App Links, Video, Feedback, Menu, Business/Profile page) maps onto five still-unimplemented `QRType` entries in this codebase: `app`, `social`, `multi_link`, `menu`, `feedback` — `video` was already built in Module 3.8, and "Business/Profile page" is folded into `social`'s own richer profile-page shape (avatar/description/theme) rather than a sixth registry entry, since the registry never had a separate type for it.

`app`'s registry entry is corrected here: Module 1.3 had set `staticSupport: true`, but building the real schema exposed why that was never actually viable — an App Links QR has three independent destination fields (iOS/Android/fallback) with no single canonical one, and its whole value (a device-aware CTA) requires a server request, which a static QR — raw bytes with no server involved — can't provide. Every other `needsLandingPage: true` type in this registry (pdf/images/audio/social/multi_link/menu/feedback) is already dynamic-only for the same underlying reason; `app` now matches that pattern instead of being an inconsistent one-off. (`video` remains the sole exception, because it has exactly one URL field and a meaningful static fallback: encode the raw link.)

### `payload_data` stays the one content store, `landing_page_config` stays reserved

`qr_codes.landing_page_config` (added Module 1.4) carries a comment explicitly earmarking it "for Module 3.9" — worth addressing directly rather than silently ignoring. In practice, none of these five types have a meaningful split between "content" and "landing-page config": a social page's title/links/theme _is_ both, the same way a PDF QR's Storage path _is_ both in Module 3.8. Introducing a second storage column and a second read/write path through `resolve_landing_page`/`saveQrCode`/`updateQrCode` for only 5 of 20 types would be complexity with no functional payoff, given `payload_data` already does the job — proven, tested, and uniform across every landing-page type since Module 3.8. All five types here use `payload_data`, exactly like `pdf`/`images`/`audio`. `landing_page_config` stays unused, reserved for a genuinely orthogonal future need (e.g., a branding/theme layer applied independently of a QR's own content type) rather than repurposed under pressure from an old comment.

### The five types

- **`app`**: `iosUrl`/`androidUrl`/`fallbackUrl` (all optional, at least one required) + `title`. The landing page (`AppLandingPage.tsx`) reads the visitor's own User-Agent server-side via `headers()` and Module 3.7's `parseUserAgent()` — the same classifier scan analytics already uses — to order the CTA buttons (iOS visitor sees the App Store link first, Android sees Google Play first, everyone else sees them in a fixed default order), never hiding the other safe links, just reordering.
- **`social`**: the full profile-page experience — title, avatar (a pasted URL, not an upload; `needsStorage: false` was an existing Module 1.3 decision this module doesn't revisit), description, an ordered link list, dedicated social-platform icons, and one of three theme presets (`light`/`dark`/`brand`, a few utility classes each — not a general theming system, since three presets is what the prompt actually asks for).
- **`multi_link`**: the bare-bones sibling — just a title and an ordered link list, deliberately not sharing `social`'s schema under a second name, so the two types stay genuinely distinct in scope rather than duplicated.
- **`menu`**: title, description, and a flat list of items (name, price, free-text category, optional description, optional photo) — `category` is a plain string rather than a nested array-of-categories-of-items; grouping by a shared string at render time is simpler to build and edit than reordering nested categories, and produces the same grouped-menu result. Item photos reuse the `qr-gallery` bucket and its Module 3.8 public-read policy (`qr_gallery_public_read_active`) rather than provisioning a dedicated bucket for one field on one type — `asset-upload.ts`'s `ASSET_BUCKETS.menu` and `asset-sync.ts`'s new `menuAssets()` extractor both point at `qr-gallery`.
- **`feedback`**: the one type with real anonymous write-back, covered in its own section below.

### Feedback write-back: the same no-service-role-key pattern, applied to an insert

A visitor submitting feedback has no session at all, so the same architectural constraint from Module 3.6/3.8 applies again: no client-facing RLS write policy (that would let a caller attach fabricated feedback to any `qr_code_id` directly), and no service-role key. Migration `20260819190000_add_feedback_submissions.sql` adds `qr_feedback_submissions` (owner-only `select` via the same `qr_codes.user_id` join `qr_scan_events` uses, zero insert/update/delete policy for any role) plus a `SECURITY DEFINER` RPC, `submit_qr_feedback(p_slug, p_rating, p_comment, p_contact)` — resolves the slug itself, only ever inserts against a real `dynamic`+`active`+`feedback`-type QR, and silently no-ops otherwise (unknown slug, paused/archived QR, wrong type) so the caller can never distinguish "doesn't exist" from "exists but inactive" from a successful submission, mirroring `record_qr_scan`'s own no-op-on-miss behavior. **Live-verified as genuinely anonymous**: a raw `curl` carrying only the anon key (`apikey` header, no cookies, no `Authorization`, no prior request to the app at all) against the Supabase REST RPC endpoint directly succeeded (`204`) and produced a real row.

`feedbackQrSchema` (owner-side: which fields to collect — rating/comment/contact toggles, a title, an optional thank-you message) and `feedbackSubmissionSchema` (visitor-side: what one submission actually contains, plus a required `consent` boolean) are deliberately two separate schemas — the owner's form never touches actual feedback data, and the visitor's submission never touches the owner's collection config. `src/lib/qr/feedback-actions.ts`'s `submitQrFeedback` (a public Server Action, no auth check) re-validates `feedbackSubmissionSchema` server-side before ever calling the RPC — `consent` itself never reaches the database; it's a pure app-layer gate satisfying the master prompt's "store feedback only if privacy policy and user consent requirements are handled" instruction. The public landing page (`FeedbackLandingPage.tsx`) shows a consent checkbox with a link to `/privacy`, disables Submit until it's checked, and the `/privacy` stub was updated (mirroring Module 3.7's own disclosure addition) to describe exactly what's collected and who can read it.

A small, real feedback list was added to the QR detail page (visible only for `qrType === "feedback"`) — `listQrFeedback()` (`src/lib/qr/queries.ts`), RLS-scoped, bounded to the most recent 50 rows (same "keep it simple at this scale" call Module 3.7 made for scan events, no pagination or rollup view). This wasn't explicitly requested by the master prompt's §3.9 text, but collecting feedback with literally no way to ever see it would be a real product gap, not a scope-respecting omission — kept intentionally minimal (a plain list, no analytics) rather than over-building it.

### A pre-existing bug fixed in passing

The QR detail page's "Printed QR links to" field always rendered `buildRedirectUrl(slug)` (`/r/[slug]`) regardless of type — correct for `url`/`whatsapp`, silently wrong for every `needsLandingPage: true` type since Module 3.8 shipped (`pdf`/`images`/`audio`/`video`), which actually print `/p/[slug]`. Directly in scope here since this module doubled the number of affected types (nine, not four) and touches the exact same `needsLandingPage` flag already being read elsewhere on the page. Fixed to branch the same way `resolveEncodedPayload` does: `buildLandingPageUrl(slug)` when `needsLandingPage`, `buildRedirectUrl(slug)` otherwise. Confirmed live for both an `app` QR (`/p/`) and a `url`-style case (unchanged `/r/` behavior, verified by the existing test suite).

### Verification

- New tests (37, taking the suite from 347 to 386 across 61 files): `app.test.ts`, `social.test.ts`, `multi-link.test.ts`, `menu.test.ts`, `feedback.test.ts` (schemas + payload builders + the owner-config/submission schema split), `feedback-actions.test.ts` (`submitQrFeedback` — real call shape, consent-required-before-RPC, null-not-undefined for omitted fields, RPC-failure handling), `asset-sync.test.ts` (+1, menu's photo-only-items-upsert), `queries.test.ts` (+3, `listQrFeedback`), `registry.test.ts` (5 new types added to `IMPLEMENTED_TYPES`). One existing test (`QRGeneratorShell.test.tsx`'s "filters the type list when switching to dynamic mode") was rewritten: it asserted `dynamicCount < staticCount`, which happened to hold only because `app` used to be counted as static-supporting; now that static- and dynamic-only type counts are evenly balanced (12/12), a size comparison is no longer a meaningful signal, so the test now asserts the actual membership change (a static-only type disappears, a dynamic-only type appears) instead — a more correct test, not a weakened one.
- `npm run typecheck` / `npx eslint .` (0 errors, 11 pre-existing `react-hooks/incompatible-library` warnings — two more than Module 3.8's count, from `AppForm`/`FeedbackForm` joining every other React-Hook-Form content form in this same harmless, pre-existing pattern) / `npx prettier --check .` — all pass.
- `npx vitest run` — **386/386 passing** across 61 files.
- `rm -rf .next && npm run build` — pass, all routes build, no `/api/test-only-*` routes present.
- **Live verification against the real Supabase project**: the new migration was pushed (`supabase db push --linked`, confirmed `qr_feedback_submissions` exists with exactly 1 RLS policy and `submit_qr_feedback` has `prosecdef = true`) using a `SUPABASE_ACCESS_TOKEN` the user supplied directly in chat for this purpose (used only as an ephemeral shell variable for the CLI push/query commands in this session — never written to any file or committed). Using a throwaway confirmed account (`mailer_autoconfirm` toggle) and the established temp-route technique (Browser pane client JS still wasn't compositing reliably this session — confirmed directly: a real button click via `element.click()` did not update React state, consistent with this project's previously-documented pane limitation, so real Server Actions were driven the proven way instead of fought with further JS-injection workarounds):
  - **App**: saved with all three links, `destination_url` stayed `null`, `/p/[slug]` rendered the title and all three CTAs (desktop User-Agent → default iOS-first ordering) with correct `href`s.
  - **Social**: saved with an avatar URL, description, one link, one Instagram icon, `brand` theme; `/p/[slug]` rendered all of it correctly.
  - **Multi Link**: saved with two links; `/p/[slug]` rendered both.
  - **Menu**: saved with two items (one with a real uploaded photo, one without), grouped correctly by category on `/p/[slug]`; the photo's `qr_assets` row was confirmed real via direct SQL (`asset_type: "menu_item_photo"`, `bucket: "qr-gallery"`), and its signed URL was fetched directly and confirmed to serve the actual uploaded bytes (`200`, correct content-type/length).
  - **Feedback**: saved, then a submission was sent two ways — once through the authenticated owner's own session (proving the mechanics) and once as a **genuinely anonymous `curl` call carrying only the anon key, no session of any kind** (proving the RPC needs no auth) — both produced real rows, confirmed via direct SQL. Pausing the QR and re-attempting the anonymous submission returned the same success response (never leaking status) but inserted **zero** additional rows, confirmed via a row-count check before and after. `/p/[slug]` correctly showed the "not active" message while paused. RLS cross-check: an anonymous `curl` `select` against `qr_feedback_submissions` returned zero rows (`200`, empty array — RLS silently filters rather than erroring), while the owner's own `listQrFeedback()` call (exercised through the QR detail page, which now shows a real "Feedback (2)" section) correctly returned both submissions with full detail.
  - **The `/p/` vs `/r/` detail-page fix**: confirmed live — the App QR's detail page showed `http://localhost:3000/p/<slug>`, not `/r/<slug>`.
  - **Cleanup**: all 5 test QR codes deleted via the real `deleteQrCode` action (confirmed the menu photo's Storage object and `qr_assets` row were both removed as part of that, and the feedback submissions cascade-deleted with their parent QR); the throwaway account deleted; `mailer_autoconfirm` restored to `false` and reconfirmed; the temporary route removed (confirmed via `git status`). Final check: exactly one `auth.users` row remains — the permanent `mts.pk@hotmail.com` account — and zero `qr_codes`/`qr_assets`/`qr_feedback_submissions` rows exist anywhere in the project.

### Known issues

- None blocking. The feedback list on the QR detail page is intentionally minimal (no pagination, no export, no per-submission delete) — a small, real, useful view rather than a second analytics subsystem; extending it is a scoped follow-up if ever needed, not a redesign.

## Dashboard Search, Filters, and Organization (Module 3.10)

### Every dimension is a real database query, not a client-side filter

The master prompt's own instruction is explicit: "Avoid loading thousands of QR rows client-side and filtering them in memory. Use database queries." Two pre-existing pages already violated this in spirit even before this module — `/dashboard/qr-codes` fetched every one of the user's QR codes unfiltered and unpaginated, and `/dashboard` (Overview) fetched everything again just to compute three aggregate numbers and slice the newest three. Both are fixed here, not just the new list-page UI:

- **`listQrCodesPage()`** (`src/lib/qr/queries.ts`) is the real, parameterized query: `.ilike()` for name search, `.eq()` per filter dimension (type/mode/status/folder), `.order()` for sort, `.range()` for pagination, and Postgres's own `count: "exact"` for the total — never `array.length` after fetching everything. `listQrCodes()` (unpaginated) stays, unchanged, for the one legitimate case that still needs every row at once: the Files page's asset→QR name lookup.
- **`get_my_qr_code_stats()`** (new migration `20260820100000_add_qr_search_and_stats.sql`) computes the Overview page's three aggregate cards in one query instead of fetching every row to `.length`/`.filter()`/`.reduce()` in JavaScript. Deliberately **not** `SECURITY DEFINER` — a plain SQL function runs as the calling role (Postgres's default), so `qr_codes_select_own`'s existing RLS policy scopes it to the caller's own rows with zero additional logic, the same way any other query already does. Live-verified: a raw anonymous `curl` call to this RPC (no session, only the anon key) returned `{total_count: 0, dynamic_count: 0, total_scans: 0}` — not the real signed-in test user's actual numbers — confirming RLS gates it correctly even though the function itself has no explicit auth check.
- **Search performance**: `pg_trgm` (newly enabled) backs a GIN trigram index on `qr_codes.name`, making `ilike '%term%'` (genuine substring search, not just a prefix) an index scan rather than a full table scan at any real scale. `ilike`'s own wildcard characters (`%`, `_`) are escaped in the search term before being embedded in the pattern, so a literal `%` or `_` in a QR's name is matched literally — verified live: searching for a QR literally named `"50% Off Deal"` with the term `%` matched only that one row, not every row (which is what an unescaped `%` would do as a live SQL wildcard).
- **One composite index** — `(user_id, status, updated_at desc)` — covers the actual default view shape ("this user's own non-archived codes, newest-updated first"). Deliberately not one index per sort option: Module 3.13 (Performance and Reliability) owns database-index tuning as its own dedicated audit, so this stays minimal rather than pre-building speculative indexes now.

### Filters, sort, and pagination live entirely in the URL

`QRCodesFilterBar` (client component) writes every control directly to the page's own URL search params (`q`, `type`, `mode`, `status`, `folder`, `sort`, `dir`, `page`) via `router.push()` — there's no separate client-side filter state to keep in sync with the server-rendered list, and the URL is bookmarkable/shareable as a natural side effect. `parseQrListSearchParams()` (`src/lib/qr/list-filters.ts`) turns those raw, untrusted strings into validated `ListQrCodesPageFilters`, silently dropping anything unrecognized (an unknown type, a malformed page number) rather than throwing — a stale or hand-edited URL degrades gracefully instead of 500ing the page. Search is debounced 300ms client-side before it reaches the URL; every other control updates immediately. Any filter change resets `page` back to 1 (a new filter almost never still has enough matching rows for whatever page the user was on); paging itself never resets other filters.

`Pagination` renders plain `<Link>`s to `?page=N` (not client-side page state) and renders nothing at all when there's only one page — no dead "Page 1 of 1" chrome.

### Two distinct empty states, per the master prompt's own requirement

`/dashboard/qr-codes` distinguishes "you have never created a QR code" (`totalCount === 0` with **no** active filters — the true empty state, with a "Create QR Code" call to action) from "your current search/filter combination matches nothing" (`items.length === 0` while filters _are_ active — a "No matching QR codes" state with a "Clear filters" link, not a dead end). Live-verified: an account with zero QR codes ever showed the first state; the same account after seeding six QR codes, searched for a term matching none of them, showed the second.

### Folders: minimal, on purpose

`qr_folders` and `qr_codes.folder_id` (schema + RLS from Module 1.4/1.5) had existed unused since before Phase 3 began. This module gives them real CRUD (`src/lib/folders/{queries,actions}.ts`) scoped deliberately small — create and delete only, no rename — because "optional folders" (the master prompt's own phrasing) is meant as a light organizational aid on top of search/filter, not a full file-manager. Deleting a folder relies entirely on the existing `ON DELETE SET NULL` constraint: every QR code in it becomes unfiled, never deleted — live-verified (create folder → assign a QR to it → delete the folder → the QR still exists, now unfiled). A QR's folder is assigned via a plain per-row `<select>` (`QRCodeFolderSelect`), not folded into `QRCodeRowActions`'s button row — a single dropdown fits the action better than a sixth button.

### A pre-existing anti-pattern fixed in the same pass

`/dashboard` (Overview) fetched every QR code just to compute `qrCodes.length`, filter for dynamic count, `.reduce()` for total scans, and sort+slice for "Recent" — exactly the pattern this module's own gate prohibits, sitting one file away from the page actually being rewritten. Fixed alongside the list page: `getMyQrCodeStats()` for the three cards, a 3-row `listQrCodesPage()` call for "Recent QR Codes." Directly in scope since it's the same anti-pattern, the same query layer, and the same module's own stated goal.

### Verification

- New tests (37, taking the suite from 386 to 442 across 68 files): `queries.test.ts` (+13, `listQrCodesPage`'s every filter/sort/pagination/escaping branch, `getMyQrCodeStats`), `list-filters.test.ts` (11, every search-param validation branch), `folders/queries.test.ts`, `folders/actions.test.ts` (create/delete/assign, auth-required, duplicate-name, RLS-zero-rows), `QRCodesFilterBar.test.tsx`, `Pagination.test.tsx`, `FolderManager.test.tsx`, `QRCodeFolderSelect.test.tsx`. Two existing test files updated for the new required `folderId` field on `QrCodeRecord`.
  - **A real debounce-testing bug fixed along the way**: the first draft of `QRCodesFilterBar.test.tsx`'s two debounce tests used `userEvent` combined with `vi.useFakeTimers()`, which hung indefinitely (a known interaction between `userEvent`'s internal timing and fake timers) — and because the hang happened _inside_ the test, the `vi.useRealTimers()` cleanup at the end never ran, poisoning every subsequent test in the file with stuck fake timers too. Fixed by dropping fake timers entirely: `fireEvent.change` (a single synchronous event, no per-keystroke delay to simulate) plus `waitFor` with real timers, matching this project's own standing lesson ("don't fight `setTimeout`-based delays — assert on the eventual state instead") rather than fighting the ecosystem's `userEvent`/fake-timer interaction.
- `npm run typecheck` / `npx eslint .` (0 errors, same 11 pre-existing warnings) / `npx prettier --check .` — all pass.
- `npx vitest run` — **442/442 passing** across 68 files.
- `rm -rf .next && npm run build` — pass, all routes build, `/dashboard/qr-codes` still dynamic (ƒ) as expected (auth-gated + `useSearchParams`).
- **Live verification against the real Supabase project**: the new migration was pushed (`pg_trgm` confirmed enabled, both indexes confirmed present, `get_my_qr_code_stats` confirmed **not** `SECURITY DEFINER`) using a `SUPABASE_ACCESS_TOKEN` the user pasted directly in chat for this purpose (ephemeral shell variable only, never written to a file). Using a throwaway confirmed account and the established temp-route technique:
  - Seeded 6 real QR codes spanning multiple types/modes/names (including one deliberately named with a literal `%`).
  - **Search**: `"Menu"` correctly matched only the 2 relevantly-named codes; the literal-`%` escaping test matched only the one row that genuinely contains `%`, not all 6 (proof the escaping is real, not just documented).
  - **Filters**: type (`vcard` → 2), mode (`dynamic` → 1), status (default excludes archived; explicit `archived` → 0; explicit `active` → all 6) all matched expectations exactly.
  - **Sort + pagination**: alphabetical sort verified correct order; `pageSize: 2` across pages 1–2 returned the correct 2-item slices in the correct order, with `pageCount` computed correctly from `totalCount`.
  - **Folders**: created a folder, assigned a QR to it, confirmed the folder-filtered view showed exactly that QR; deleted the folder; confirmed the QR still existed and was now unfiled (not deleted) — the `ON DELETE SET NULL` behavior working live, not just asserted in a migration comment.
  - **The actual rendered page** (not just the query layer) was verified via direct navigation to filtered URLs (`?q=Menu&sort=name&dir=asc`, a zero-match search, the unfiltered default) — server-rendered output matched exactly what the query layer returned, and both the true-empty and no-results states rendered correctly and distinctly.
  - **RLS on the new stats RPC**: a genuinely anonymous `curl` call (only the anon key, no session at all) returned all-zero stats, not the signed-in test user's real 6-QR-code numbers.
  - **Cleanup**: all 6 test QR codes and the test folder deleted via the real actions; the throwaway account deleted; `mailer_autoconfirm` restored to `false` and reconfirmed; the temporary route removed (confirmed via `git status`). Final check: exactly one `auth.users` row (the permanent `mts.pk@hotmail.com` account, confirmed to have had zero QR codes throughout — untouched) and zero `qr_codes`/`qr_folders` rows anywhere in the project.

### Known issues

- None blocking. Folder rename isn't supported (create/delete only) — a deliberate scope decision, not an oversight; add it later if real usage shows it's needed.
- The Pagination component's real page-2+ rendering was proven through the exact same `listQrCodesPage()` calls the page itself makes (live, with real `pageSize`/`page` values producing correct slices) and through component-level tests with mocked `page`/`pageCount` props, but wasn't observed through 20+ real seeded rows forcing the actual `/dashboard/qr-codes` page past its default page size — seeding that many rows just to watch the same already-proven code path render didn't add meaningfully to confidence, so it was skipped.

## QR Status, Duplicate, Archive, and Safe Delete (Module 3.11)

### Mostly an audit, not a rebuild — but it found one real bug

Duplicate, Archive, Pause, and Delete all already existed from Modules 3.5/3.6, so this module's job was to check each one against the master prompt's specific wording rather than build from scratch. Two genuine gaps came out of that audit and are fixed here; everything else was confirmed already correct.

### The bug: a duplicated file-based QR silently shared the original's Storage object

`duplicateQrCode` copied `payload_data` as-is, including its Storage path reference(s) — but never created a `qr_assets` row for the new QR, so the _original_ remained the sole owner of that `(bucket, path)`. The danger: deleting the original later would delete the underlying Storage object (via `deleteQrCode`'s existing cleanup), silently breaking the duplicate's landing page even though the duplicate itself was never touched. This is exactly the "accidental cascading loss" the master prompt's own Delete section warns against — deleting one QR should never break a different one.

The fix, `duplicateQrAssets()` (`src/lib/qr/asset-sync.ts`): for any `needsStorage` type, each Storage object is genuinely copied — `supabase.storage.from(bucket).copy(oldPath, newPath)` (no download/re-upload round trip) to a fresh `{user_id}/{uuid}/{filename}` path — and a new `qr_assets` row is inserted for the _new_ QR pointing at the copy. `duplicateQrCode` then rewrites the duplicate's `payload_data` (per-type: `pdf`/`audio`'s single `path`, `images`' array, `menu`'s per-item `photo.path`) to reference the new paths before the row is considered final. Best-effort per asset — if one file's copy fails, that one item is left referencing the original's path rather than failing the whole duplicate action (matching `syncQrAssets`'s existing "don't let asset housekeeping block the core action" precedent in the same file).

**Live-verified end to end**: uploaded a real PDF, saved it as a dynamic PDF QR, duplicated it — confirmed the duplicate's `payload_data.path` was a genuinely different path, confirmed via direct SQL that both QRs now own independent `qr_assets` rows, confirmed the copied file at the new path contains the exact original bytes (a real `.copy()`, not a broken reference), then **deleted the original** and confirmed: the original's file is gone (correct), the duplicate's file still exists (the actual fix), and the duplicate's `/p/[slug]` landing page still serves the correct PDF bytes through a working signed URL.

### The other gap: `/r/[slug]` returned raw JSON for a paused/missing QR

The master prompt is specific: pausing a dynamic QR should show "a controlled unavailable page rather than redirecting." Module 3.6 already correctly returns 404/410 instead of redirecting, but the response body was `{"error": "not_found"}`/`{"error": "inactive"}` — a raw JSON blob, not a page a visitor scanning a printed code could make sense of. Fixed with `renderUnavailablePage()` (`src/app/r/[slug]/route.ts`): a small, self-contained HTML response (inline CSS, no dependency on the app's normal layout/stylesheet pipeline — Module 3.13 cares about keeping this hot redirect path lightweight, so this deliberately doesn't pull in React rendering or the global stylesheet) with a distinct message for "doesn't exist" vs. "paused/archived." Status codes (404/410) and the underlying resolution logic (`resolveDynamicQrRedirect`, unchanged since Module 3.6) are untouched — only the response body changed. Live-verified: a genuinely unknown slug on the real dev server returned a real HTML page (`<title>Link not found — QRForge</title>`, status 404, confirmed via the page's own title bar and a direct network-request check) instead of raw JSON.

### Delete confirmation now discloses what it actually destroys

The delete `<dialog>`'s copy always said "This permanently deletes the QR code and its scan history" regardless of type — accurate for a plain type, incomplete for a file-based type (also destroys Storage files) or a feedback type (also destroys submissions, which cascade via `ON DELETE CASCADE` same as scan events). `deleteScopeMessage()` (`src/components/dashboard/QRCodeRowActions.tsx`) now composes the disclosure from the actual type: `needsStorage` adds "any uploaded files," `feedback` adds "any feedback received." The underlying delete behavior itself was already correct (confirmed via Module 3.8/3.9's own live verification) — this only fixes what the confirmation _says_, so the disclosure matches reality.

### Everything else, confirmed already correct (no change needed)

- **Duplicate** (non-Storage part): copies `payload_data`/`design_config`, generates a new id (DB default), a new slug for a dynamic QR, new timestamps (DB defaults) — exactly per the master prompt's wording, unchanged since Module 3.5.
- **Archive**: a pure `status = 'archived'` update (`setQrCodeStatus`) — no cascade, `qr_scan_events`/`qr_feedback_submissions` are untouched, `listQrCodesPage`'s default view already excludes archived rows (Module 3.10). Analytics for an archived QR remain fully intact and viewable.
- **Delete's Storage/scan-history behavior**: already fully defined since Modules 3.5/3.8 — real Storage objects removed via `deleteQrCode`, `qr_scan_events`/`qr_feedback_submissions` cascade via `ON DELETE CASCADE` on `qr_code_id` (intentional — scan/feedback history is meaningless without its parent QR, and now properly disclosed in the confirmation dialog per above).

### Verification

- New/updated tests (17 net, taking the suite from 442 to 451 across 68 files): `asset-sync.test.ts` (+5, every `duplicateQrAssets` branch — single file, gallery, menu photo, no-assets-for-this-type, copy-failure-leaves-original-path), `actions.test.ts` (+1, the full duplicate-with-asset-copy flow), `QRCodeRowActions.test.tsx` (+3, the three `deleteScopeMessage` variants), `r-slug-route.test.ts` (2 rewritten — HTML body/content-type instead of JSON, same status-code assertions).
- `npm run typecheck` / `npx eslint .` (0 errors, same 11 pre-existing warnings) / `npx prettier --check .` — all pass.
- `npx vitest run` — **451/451 passing** across 68 files.
- `rm -rf .next && npm run build` — pass, all routes build.
- **Live verification against the real Supabase project** (no new migration this module — application-code-only changes; a throwaway confirmed account via the established `mailer_autoconfirm` toggle, using a `SUPABASE_ACCESS_TOKEN` the user pasted directly in chat for this purpose): the full duplicate→verify-independent-copy→delete-original→confirm-duplicate-survives sequence above, plus a zero-setup live check of `/r/[slug]`'s new HTML page against a genuinely unknown slug (no Supabase data needed for that one — a real 404 miss). All test data (2 QR codes, their Storage objects) and the throwaway account cleaned up; `mailer_autoconfirm` restored to `false`; the temporary route removed (confirmed via `git status`). Final check: exactly one `auth.users` row (the permanent `mts.pk@hotmail.com` account) and zero `qr_codes`/`qr_assets`/Storage-object rows anywhere in the project.

### Known issues

- None blocking. The 410 ("paused/archived") variant of the new `/r/[slug]` unavailable page was verified via unit test (mocked resolution → correct HTML/status) rather than a second live round-trip against a real paused QR — the resolution logic itself (`resolveDynamicQrRedirect`) is unchanged and was already thoroughly live-verified in Module 3.6; only the response _rendering_ changed, and that's the same `renderUnavailablePage()` function already proven live for the 404 case.
