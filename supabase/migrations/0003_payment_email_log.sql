-- One row per payment email so a retry does not send the same notice twice.
create table if not exists public.payment_email_log (
  hash       text not null,
  kind       text not null check (kind in ('sender', 'recipient')),
  created_at timestamptz not null default now(),
  primary key (hash, kind)
);

alter table public.payment_email_log enable row level security;
revoke all on table public.payment_email_log from public, anon, authenticated;
