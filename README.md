# QRForge — QR Code Generator

A production-ready QR code generation platform: 18 real QR types (static and dynamic), live design customization, real-time preview and export, an account dashboard with search/filter/folders, scan analytics, and file/hosted-page QR types — backed by Supabase with row-level security enforced on every table and **no use of the Supabase service-role key anywhere in the codebase**.

Built in strict phase order (`STRUCTURE → UI → FEATURES`) per [`QR_Code_Generator_Master_Build_Prompt.md`](./QR_Code_Generator_Master_Build_Prompt.md), the single source of truth for module scope and acceptance criteria. See [`docs/WORKLOG.md`](./docs/WORKLOG.md) for the full per-module build log and [`docs/SESSION_HANDOFF.md`](./docs/SESSION_HANDOFF.md) for current state.

## What's built

- **QR types**: URL, text, email, phone, SMS, WhatsApp, Wi-Fi, vCard, event, video (static-or-dynamic); PDF, image gallery, audio (dynamic, file-hosted); social/link-in-bio, multiple links, app-store links, menu, feedback (dynamic, hosted page). `barcode_2d` and `location` remain not-yet-implemented.
- **Design**: real-time preview, colors/gradients/frames/corner styles/logo overlay, with built-in scannability checks (contrast, quiet zone, logo size, error-correction level).
- **Dynamic QR codes**: editable destination after printing, pause/reactivate, real scan analytics (device/OS/browser/country, never raw IP).
- **Dashboard**: database-driven search/filter/sort/pagination, folders, duplicate/archive/safe-delete.
- **Auth**: real Supabase Auth, session-derived ownership everywhere (never trusts a client-supplied user id).
- **Security**: RLS on every table, rate limiting on public endpoints, a real CSP and security headers, zero use of the service-role key (every privileged operation goes through a narrow `SECURITY DEFINER` Postgres function instead).
- **SEO**: real metadata/canonical/Open Graph on every public page, `sitemap.ts`/`robots.ts`, `FAQPage` JSON-LD.
- **Testing**: 474 unit/component tests (Vitest) + a 6-journey Playwright E2E suite covering anonymous generation, signup, dynamic QR editing, analytics, cross-user authorization, and file QR replacement — all live-verified against a real Supabase project.

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full rationale behind every module, and [`docs/FINAL_REPORT.md`](./docs/FINAL_REPORT.md) for a complete summary.

## Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack) + TypeScript (strict) + React 19
- **Styling:** Tailwind CSS 4
- **Backend:** Supabase — Postgres, Auth, Storage, Row Level Security (no service-role key used anywhere)
- **Testing:** Vitest + Testing Library (unit/component), Playwright (E2E)
- **Quality:** ESLint (flat config), Prettier, TypeScript strict checks

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project's values — see docs/SUPABASE_SETUP.md
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                 | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start the dev server (Turbopack)        |
| `npm run build`        | Production build                        |
| `npm run start`        | Run the production build                |
| `npm run lint`         | ESLint                                  |
| `npm run typecheck`    | TypeScript check (no emit)              |
| `npm run format`       | Format the codebase with Prettier       |
| `npm run format:check` | Check formatting without writing        |
| `npm run test`         | Run the unit test suite (Vitest)        |
| `npm run test:watch`   | Run unit tests in watch mode            |
| `npm run test:e2e`     | Run the Playwright E2E suite            |
| `npm run test:e2e:ui`  | Run the Playwright E2E suite in UI mode |

## Project Structure

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full directory architecture and the reasoning behind each module.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase project's values. Never commit `.env.local` or real secrets — see [`docs/SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md) for what each variable is and how to get it, and [`docs/SECURITY.md`](./docs/SECURITY.md) for this project's security posture (RLS-everywhere, no service-role key, rate limiting, CSP).

## Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — directory & system architecture, with a section per module explaining what was built and why
- [`docs/WORKLOG.md`](./docs/WORKLOG.md) — per-module build log (what was done, how it was verified)
- [`docs/SESSION_HANDOFF.md`](./docs/SESSION_HANDOFF.md) — current state and standing lessons, for resuming work in a new session
- [`docs/FINAL_REPORT.md`](./docs/FINAL_REPORT.md) — the project's final report (product summary, architecture, database, testing, known limitations, production configuration)
- [`docs/SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md) — how to link and configure a Supabase project for this app
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — required production configuration
- [`docs/SECURITY.md`](./docs/SECURITY.md) — this project's security posture, consolidated
