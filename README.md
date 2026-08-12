# QR Code Generator

A production-oriented QR code generation platform: static and dynamic QR codes, live design customization, an account dashboard, and scan analytics. Built with functional/UX inspiration from QR.io, using an original visual identity and implementation.

This project is being built in strict phase order:

```
STRUCTURE → UI → FEATURES
```

See [`QR_Code_Generator_Master_Build_Prompt.md`](./QR_Code_Generator_Master_Build_Prompt.md) for the full module-by-module build spec, and [`docs/WORKLOG.md`](./docs/WORKLOG.md) for current progress.

## Tech Stack

- **Frontend:** Next.js (App Router, latest stable) + TypeScript (strict) + React
- **Styling:** Tailwind CSS
- **Backend (planned):** Supabase — Postgres, Auth, Storage, Row Level Security
- **Quality:** ESLint (flat config), Prettier, TypeScript strict checks

Supabase is not yet connected. It will be integrated in Phase 3 (Features), starting with Module 3.1, once client/server data access is actually needed.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                 | Purpose                           |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start the dev server (Turbopack)  |
| `npm run build`        | Production build                  |
| `npm run start`        | Run the production build          |
| `npm run lint`         | ESLint                            |
| `npm run typecheck`    | TypeScript check (no emit)        |
| `npm run format`       | Format the codebase with Prettier |
| `npm run format:check` | Check formatting without writing  |

## Project Structure

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full directory architecture and responsibilities of each module.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values as each module requires them. Never commit `.env.local` or real secrets. See [`docs/SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md) once it exists (added when Supabase integration begins).

## Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — directory & system architecture
- [`docs/WORKLOG.md`](./docs/WORKLOG.md) — per-module build log
- [`docs/SESSION_HANDOFF.md`](./docs/SESSION_HANDOFF.md) — state for resuming work in a new session
