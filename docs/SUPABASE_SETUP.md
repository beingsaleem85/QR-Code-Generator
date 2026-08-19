# Supabase Setup

How to link and configure a Supabase project for this app, from scratch. This follows the "6. SUPABASE IMPLEMENTATION REQUIREMENTS" section of [`QR_Code_Generator_Master_Build_Prompt.md`](../QR_Code_Generator_Master_Build_Prompt.md) — read that first if you're setting up a new environment.

## 1. Create or choose a Supabase project

Create a project at [supabase.com](https://supabase.com) (or use an existing one — **confirm the project reference before applying any migration**, since migrations are irreversible forward operations). Note the project's URL and anon key from Project Settings → API.

## 2. Link the local CLI

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

This creates `supabase/.temp/` (gitignored) holding the link state. No secret is written to a tracked file by this step.

## 3. Apply migrations, in order

```bash
npx supabase db push --linked
```

`supabase/migrations/` contains 17 migrations, applied in filename (timestamp) order — never reorder or renumber an existing one; add new changes as new, forward-only migration files. Every migration in this project has already been applied to and verified against a real project during development; running `db push` against a fresh project applies the full, current schema in one pass.

For local iteration before pushing live, `supabase start` (requires Docker) + `supabase db reset` re-applies every migration plus `supabase/seed.sql` (non-sensitive development data only) against a disposable local Postgres instance.

## 4. What the migrations create

- **Tables** (all with RLS enabled, owner-scoped policies — see [`docs/SECURITY.md`](./SECURITY.md) for the full policy shape): `profiles`, `qr_folders`, `qr_codes`, `qr_scan_events`, `qr_assets`, `account_entitlements`, `qr_feedback_submissions`, `rate_limit_buckets`.
- **Storage buckets** (`storage.buckets`, created by `20260813010002_create_storage_buckets.sql`):

  | Bucket         | Public | Size limit | Allowed types        |
  | -------------- | ------ | ---------- | -------------------- |
  | `avatars`      | Yes    | 5MB        | PNG, JPEG, WebP      |
  | `qr-logos`     | No     | 2MB        | PNG, JPEG, SVG, WebP |
  | `qr-documents` | No     | 20MB       | PDF                  |
  | `qr-gallery`   | No     | 10MB       | PNG, JPEG, WebP, GIF |
  | `qr-media`     | No     | 15MB       | MP3, M4A, WAV, OGG   |

  Every non-`avatars` bucket is private by default; a narrow, additional `SECURITY DEFINER`-backed policy grants anonymous read access to exactly the files belonging to an active, dynamic QR code (see `docs/SECURITY.md`). Video QR codes have no bucket — video is always an external link (YouTube/Vimeo/etc.), by design, to avoid unbounded storage/bandwidth cost.

- **`SECURITY DEFINER` RPC functions** for every privileged operation this app needs but can't express as a plain RLS policy: redirect resolution + rate limiting (`resolve_qr_redirect_checked`), scan recording (`record_qr_scan`), landing-page resolution (`resolve_landing_page`), anonymous feedback write-back (`submit_qr_feedback`), and the generic rate limiter (`check_rate_limit`). Every one of these sets `search_path = public, pg_temp` explicitly (confirmed via a direct audit of every migration in Module 3.17) — do not add a new `SECURITY DEFINER` function without the same guard.

## 5. Configure Auth

In Project Settings → Authentication:

- **Redirect URLs** (`uri_allow_list`): add your app's origin(s) with a wildcard, e.g. `http://localhost:3000/**` for local dev, plus your real production domain once one exists (`https://yourdomain.com/**`). Required for `/auth/callback` (email confirmation, password reset) to be accepted.
- **`mailer_autoconfirm`**: leave `false` in normal operation (real email confirmation required for signup). This project's own live-verification and E2E testing sessions temporarily flip it to `true` via the Management API to provision throwaway confirmed test accounts without hitting the project's email-send rate limit — always flip it back to `false` afterward. See `docs/ARCHITECTURE.md`'s Module 3.6/3.16 sections for the exact technique.
- **Site URL**: your app's canonical origin (used in auth email templates).

## 6. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable                        | Where it comes from                                                                    | Notes                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project Settings → API                                                                 | Client-safe.                                                                                                                                                                                                                                                                                                                                                                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API                                                                 | Client-safe — this is the `anon` key, RLS-scoped, safe to expose.                                                                                                                                                                                                                                                                                                                               |
| `SUPABASE_SERVICE_ROLE_KEY`     | Project Settings → API                                                                 | **Left blank throughout this entire project on purpose.** Every privileged operation goes through a narrow `SECURITY DEFINER` Postgres function instead — see `docs/SECURITY.md`. Do not fill this in or start using it without a real, specific reason and a matching architectural review; the moment it's used, this project's "never bypasses RLS from application code" guarantee is gone. |
| `SUPABASE_ACCESS_TOKEN`         | [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) | A personal access token for the Supabase CLI/Management API — needed only for `db push`, ad-hoc `db query`, and the `mailer_autoconfirm` toggle. Never persisted to any file in this project; supply it as an ephemeral shell variable when a command needs it. Treat it as a privileged secret — never echo it back or write it to a tracked file.                                             |
| `SUPABASE_PROJECT_REF`          | Your project's URL slug                                                                | Optional convenience value; the project ref can also always be read out of `NEXT_PUBLIC_SUPABASE_URL` (`https://<ref>.supabase.co`).                                                                                                                                                                                                                                                            |
| `NEXT_PUBLIC_APP_URL`           | Your app's own origin                                                                  | Defaults to `http://localhost:3000`. Used for `metadataBase`, canonical URLs, `sitemap.ts`/`robots.ts`, and dynamic-QR redirect/landing-page link generation — set this to your real production domain when deploying.                                                                                                                                                                          |

## 7. Seed data (optional)

`supabase/seed.sql` holds only non-sensitive development data, applied automatically by `supabase db reset` against a local instance. Never add real user data, real credentials, or anything resembling production content to this file.

## 8. Verifying the setup

```bash
npm run typecheck && npm run lint && npm run format:check
npm run test
npm run build
```

Then start the dev server and confirm: signup → email confirmation (or a real, working `mailer_autoconfirm` toggle for testing) → dashboard → create a QR code → see it in the list. See [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) for what's required to actually deploy this to production.
