begin;

alter table public.profiles
  add column if not exists notification_last_seen_at timestamptz;

commit;