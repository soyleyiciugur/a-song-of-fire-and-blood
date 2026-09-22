begin;

create table if not exists public.character_player_assignments (
  character_id text primary key check (character_id ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  player_username text not null unique check (player_username ~ '^[a-z0-9_][a-z0-9_-]{1,39}$'),
  updated_at timestamptz not null default now()
);

alter table public.character_inner_court
  add column if not exists sort_order integer not null default 0;

with ranked as (
  select id, row_number() over (partition by character_id order by created_at, id) - 1 as position
  from public.character_inner_court
)
update public.character_inner_court court
set sort_order = ranked.position
from ranked
where court.id = ranked.id and court.sort_order = 0;

alter table public.character_player_assignments enable row level security;

drop policy if exists "Character assignments are publicly readable" on public.character_player_assignments;
create policy "Character assignments are publicly readable"
  on public.character_player_assignments for select using (true);

insert into public.character_player_assignments (character_id, player_username)
values
  ('jacaelon-targaryen', 'luck'),
  ('visenor-targaryen', 'ubeka'),
  ('gaelor-targaryen', 'tay'),
  ('hrrm', 'hrrm')
on conflict (character_id) do update
set player_username = excluded.player_username,
    updated_at = now();

create or replace function public.can_edit_character_inner_court(target_character_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.character_player_assignments a
      on lower(a.player_username) = lower(p.username)
    where p.id = auth.uid()
      and a.character_id = target_character_id
  );
$$;

commit;
