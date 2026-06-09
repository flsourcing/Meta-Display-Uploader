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
