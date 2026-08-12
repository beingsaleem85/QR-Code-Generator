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

TBD — Module 1.2.

## QR Domain Model

TBD — Module 1.3.

## Database Schema

TBD — Module 1.4.

## Auth, Storage, and RLS

TBD — Module 1.5.

## Component Architecture

TBD — Module 1.6.

## Error Handling Conventions

Established in Module 1.1:

- `src/app/error.tsx` — route-segment error boundary (Client Component), offers retry via `reset()`
- `src/app/global-error.tsx` — root-level fallback; replaces the root layout, so it defines its own `<html>`/`<body>`
- `src/app/not-found.tsx` — rendered on `notFound()` calls or unmatched routes
- `src/app/loading.tsx` — route-segment loading fallback

These are neutral/unstyled skeletons for now; visual polish happens in Phase 2 (UI).
