begin;

create table if not exists public.great_game_chat_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.great_game_matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint great_game_chat_body_length check (
    char_length(btrim(body)) between 1 and 500
  )
);

create index if not exists great_game_chat_match_created_idx
  on public.great_game_chat_messages(match_id, created_at asc);

alter table public.great_game_chat_messages enable row level security;
revoke all on table public.great_game_chat_messages from anon;
grant select, insert on table public.great_game_chat_messages to authenticated;

drop policy if exists great_game_chat_participant_select
  on public.great_game_chat_messages;
create policy great_game_chat_participant_select
  on public.great_game_chat_messages
  for select
  to authenticated
  using (public.is_great_game_participant(match_id));

drop policy if exists great_game_chat_participant_insert
  on public.great_game_chat_messages;
create policy great_game_chat_participant_insert
  on public.great_game_chat_messages
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_great_game_participant(match_id)
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'great_game_chat_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.great_game_chat_messages';
  end if;
end $$;

notify pgrst,'reload schema';
commit;
