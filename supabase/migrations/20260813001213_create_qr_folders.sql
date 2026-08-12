-- Optional single-level organization for a user's QR codes. One folder
-- holds many qr_codes (see qr_codes.folder_id); no folder hierarchy and no
-- many-to-many join table, since a single level is sufficient for the MVP.
create table public.qr_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint qr_folders_user_name_unique unique (user_id, name)
);

create index qr_folders_user_id_idx on public.qr_folders (user_id);

alter table public.qr_folders enable row level security;
