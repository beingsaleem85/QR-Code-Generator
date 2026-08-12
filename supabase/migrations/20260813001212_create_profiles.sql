-- One row per authenticated user, created on signup (Module 3.1).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- RLS is enabled here (default-deny) so the table is never accidentally
-- exposed; the actual policies are added in Module 1.5.
alter table public.profiles enable row level security;
