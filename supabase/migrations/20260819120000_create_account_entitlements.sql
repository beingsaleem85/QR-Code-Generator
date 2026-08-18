-- Server-controlled plan entitlement (Free / Pro / Lifetime Pro), separate
-- from `profiles` on purpose: a plan is an authorization fact, not profile
-- data, and must never be client-writable. A missing row means "free" —
-- there's no default-row trigger on signup, since "no row" already means
-- exactly the right thing and a trigger would just be a row to keep in
-- sync for no benefit.
create table public.account_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  is_lifetime boolean not null default false,
  -- NULL means "does not expire" — required for a lifetime plan, and also
  -- valid for a non-expiring free/pro grant given administratively.
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_entitlements_lifetime_has_no_expiry
    check (not is_lifetime or expires_at is null)
);

create index account_entitlements_user_id_idx on public.account_entitlements (user_id);

create trigger set_account_entitlements_updated_at
  before update on public.account_entitlements
  for each row
  execute function public.set_updated_at();

alter table public.account_entitlements enable row level security;

-- A user may read their own entitlement (to show "Pro"/"Lifetime Pro" in
-- the UI) but there is deliberately NO insert/update/delete policy for
-- `anon`/`authenticated` at all — a user can never promote themselves, set
-- `is_lifetime`, or change `expires_at`. The only way to grant or change an
-- entitlement is a direct, privileged database operation (today: the
-- Supabase CLI against the live project) or, if a real admin UI is ever
-- built, a narrow `SECURITY DEFINER` function analogous to Module 3.6's
-- redirect functions — never a normal RLS write policy.
create policy "account_entitlements_select_own" on public.account_entitlements
  for select to authenticated
  using (auth.uid() = user_id);
