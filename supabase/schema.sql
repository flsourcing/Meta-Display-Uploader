create table if not exists display_sessions (
  session_id uuid primary key,
  code text not null,
  code_bucket bigint not null,
  code_expires_at timestamptz not null,
  media_type text,
  media_url text,
  media_name text,
  media_uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists display_sessions_code_idx
  on display_sessions (code, code_expires_at desc);

alter table display_sessions enable row level security;

create policy "Public read display sessions"
  on display_sessions for select
  using (true);

create policy "Public insert display sessions"
  on display_sessions for insert
  with check (true);

create policy "Public update display sessions"
  on display_sessions for update
  using (true);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

create policy "Public read uploaded media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Public upload media"
  on storage.objects for insert
  with check (bucket_id = 'media');
