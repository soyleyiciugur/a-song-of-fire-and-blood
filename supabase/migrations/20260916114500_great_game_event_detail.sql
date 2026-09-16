begin;

alter table public.great_game_events
  add column if not exists detail jsonb not null default '{}'::jsonb;

notify pgrst,'reload schema';
commit;
