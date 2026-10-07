create table if not exists public.great_game_social_reactions (
  match_id uuid not null references public.great_game_matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create table if not exists public.great_game_social_replies (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.great_game_matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 420),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists great_game_social_replies_match_created_idx
  on public.great_game_social_replies(match_id, created_at);

alter table public.great_game_social_reactions enable row level security;
alter table public.great_game_social_replies enable row level security;

revoke all on public.great_game_social_reactions, public.great_game_social_replies from public;
grant select on public.great_game_social_reactions, public.great_game_social_replies to anon, authenticated;
grant insert, delete on public.great_game_social_reactions to authenticated;
grant insert, update, delete on public.great_game_social_replies to authenticated;

drop policy if exists "great game reactions are public" on public.great_game_social_reactions;
create policy "great game reactions are public" on public.great_game_social_reactions
  for select using (true);

drop policy if exists "members add own great game reactions" on public.great_game_social_reactions;
create policy "members add own great game reactions" on public.great_game_social_reactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "members remove own great game reactions" on public.great_game_social_reactions;
create policy "members remove own great game reactions" on public.great_game_social_reactions
  for delete using (auth.uid() = user_id);

drop policy if exists "great game replies are public" on public.great_game_social_replies;
create policy "great game replies are public" on public.great_game_social_replies
  for select using (true);

drop policy if exists "members add own great game replies" on public.great_game_social_replies;
create policy "members add own great game replies" on public.great_game_social_replies
  for insert with check (auth.uid() = user_id);

drop policy if exists "members update own great game replies" on public.great_game_social_replies;
create policy "members update own great game replies" on public.great_game_social_replies
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "members remove own great game replies" on public.great_game_social_replies;
create policy "members remove own great game replies" on public.great_game_social_replies
  for delete using (auth.uid() = user_id);
