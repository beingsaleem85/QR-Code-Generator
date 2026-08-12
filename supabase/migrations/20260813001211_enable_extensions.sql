-- Extensions required by later migrations (uuid generation).
create extension if not exists "pgcrypto";

-- Shared trigger function: keeps `updated_at` current on every row update.
-- Used by profiles and qr_codes.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
