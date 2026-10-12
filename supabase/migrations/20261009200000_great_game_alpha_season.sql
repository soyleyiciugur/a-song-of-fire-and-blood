begin;
create table public.great_game_seasons(
 id text primary key, stage text not null, name text not null,
 status text not null check(status in('planned','active','closed')),
 started_at timestamptz, ended_at timestamptz,
 check(status='planned' or started_at is not null),
 check(status<>'closed' or ended_at is not null),
 check(ended_at is null or ended_at>=started_at)
);
create unique index great_game_one_active_season on public.great_game_seasons(status) where status='active';
alter table public.great_game_seasons enable row level security;
revoke all on public.great_game_seasons from public,anon,authenticated;
grant select on public.great_game_seasons to anon,authenticated;
grant all on public.great_game_seasons to service_role;
create policy seasons_public_read on public.great_game_seasons for select to anon,authenticated using(true);
insert into public.great_game_seasons(id,stage,name,status,started_at) values
 ('alpha','Alpha','The First Embers','active',coalesce((select min(created_at) from public.great_game_matches where match_type='ranked'),now())),
 ('beta','Beta','The Gathering Storm','planned',null);
alter table public.great_game_matches add column season_id text references public.great_game_seasons(id);
alter table public.great_game_match_results add column season_id text references public.great_game_seasons(id);
-- Attribute existing results without touching outcomes, clocks, dates or Elo.
update public.great_game_matches set season_id='alpha' where match_type='ranked';
update public.great_game_match_results set season_id='alpha' where match_type='ranked';
alter table public.great_game_matches add constraint great_game_match_season_type check((match_type='ranked' and season_id is not null) or (match_type='custom' and season_id is null));
alter table public.great_game_match_results add constraint great_game_result_season_type check((match_type='ranked' and season_id is not null) or (match_type='custom' and season_id is null));
create index great_game_result_season_idx on public.great_game_match_results(season_id,completed_at,match_id,user_id) where match_type='ranked';
create function public.assign_great_game_season() returns trigger language plpgsql security definer set search_path=public as $$
declare current_id text;
begin
 if tg_op='UPDATE' then
  if new.season_id is distinct from old.season_id then raise exception 'A table season cannot change'; end if;
 elsif new.match_type='ranked' then
  select id into current_id from public.great_game_seasons where status='active';
  if current_id is null then raise exception 'No competitive season is active'; end if;
  if new.season_id is not null and new.season_id<>current_id then raise exception 'Ranked tables belong to the active season'; end if;
  new.season_id:=current_id;
 elsif new.season_id is not null then raise exception 'Custom tables cannot join a competitive season';
 end if;
 return new;
end $$;
create trigger great_game_assign_season before insert or update on public.great_game_matches for each row execute function public.assign_great_game_season();
create function public.assign_great_game_result_season() returns trigger language plpgsql security definer set search_path=public as $$
declare table_season text; table_type text;
begin
 select season_id,match_type into table_season,table_type from public.great_game_matches where id=new.match_id;
 if new.match_type<>table_type then raise exception 'Result type must match its table'; end if;
 if tg_op='UPDATE' and new.season_id is distinct from old.season_id then raise exception 'A result season cannot change'; end if;
 if new.season_id is not null and new.season_id is distinct from table_season then raise exception 'Result season must match its table'; end if;
 new.season_id:=table_season;return new;
end $$;
create trigger great_game_result_season before insert or update on public.great_game_match_results for each row execute function public.assign_great_game_result_season();
create or replace view public.great_game_match_history with(security_barrier=true) as
select r.match_id,r.user_id,r.opponent_id,p.username opponent_username,p.display_name opponent_display_name,p.avatar_url opponent_avatar_url,
 r.result,r.deck_name,r.faction,r.duration_seconds,r.turns,r.rating_before,r.rating_after,r.completed_at,
 r.standing_after,r.opponent_standing_after,r.match_type,r.season_id,
 case when s.id is not null then s.stage || ' Season — ' || s.name end season_display_name
from public.great_game_match_results r join public.profiles p on p.id=r.opponent_id left join public.great_game_seasons s on s.id=r.season_id;
grant select on public.great_game_match_history to anon,authenticated;
notify pgrst,'reload schema';
commit;
