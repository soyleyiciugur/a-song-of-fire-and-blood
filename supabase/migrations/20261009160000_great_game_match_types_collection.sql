-- Apply before deploying the matching application. Legacy tables remain ranked.
begin;
alter table public.great_game_matches add column match_type text not null default 'ranked' check(match_type in ('custom','ranked'));
alter table public.great_game_match_results add column match_type text not null default 'ranked' check(match_type in ('custom','ranked'));
create index great_game_results_type_user_idx on public.great_game_match_results(match_type,user_id,completed_at desc);
create function public.keep_great_game_match_type() returns trigger language plpgsql set search_path=public as $$
begin
  if new.match_type is distinct from old.match_type then raise exception 'A table match type cannot change'; end if;
  return new;
end $$;
create trigger great_game_fixed_match_type before update on public.great_game_matches for each row execute function public.keep_great_game_match_type();
create or replace function public.record_great_game_result()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  hr text; gr text; hb integer; gb integer; ha integer; ga integer;
  host_standing integer; guest_standing integer;
  hs numeric; expected numeric;
  seconds_played integer := greatest(0,extract(epoch from (new.completed_at-coalesce(new.started_at,new.created_at)))::integer);
  ht integer := coalesce((new.state->'players'->'player1'->>'turnsTaken')::integer,0);
  gt integer := coalesce((new.state->'players'->'player2'->>'turnsTaken')::integer,0);
begin
  if new.guest_id is null or new.completed_at is null or new.status not in ('finished','abandoned') then return new; end if;
  if exists(select 1 from public.great_game_match_results where match_id=new.id) then return new; end if;

  host_standing := nullif(new.state #>> '{players,player1,standing}', '')::integer;
  guest_standing := nullif(new.state #>> '{players,player2,standing}', '')::integer;

  if new.status='abandoned' then
    hr:=case when new.abandoned_by=new.host_id then 'abandon' else 'win' end;
    gr:=case when new.abandoned_by=new.guest_id then 'abandon' else 'win' end;
  elsif new.winner_user_id=new.host_id then hr:='win'; gr:='loss';
  elsif new.winner_user_id=new.guest_id then hr:='loss'; gr:='win';
  else hr:='draw'; gr:='draw'; end if;

  if new.match_type = 'ranked' then
  insert into public.great_game_ratings(user_id) select id from (values(new.host_id),(new.guest_id)) participants(id) order by id on conflict(user_id) do nothing;
  -- Lock both players in stable order, including when they play at different tables.
  perform 1 from public.great_game_ratings where user_id in(new.host_id,new.guest_id) order by user_id for update;
  select rating into hb from public.great_game_ratings where user_id=new.host_id for update;
  select rating into gb from public.great_game_ratings where user_id=new.guest_id for update;
  hs:=case when hr='win' then 1 when hr='draw' then .5 else 0 end;
  expected:=1.0/(1.0+power(10.0,(gb-hb)/400.0));
  ha:=greatest(0,round(hb+32*(hs-expected))::integer);
  ga:=greatest(0,gb+(hb-ha));
  update public.great_game_ratings set rating=ha,peak_rating=greatest(peak_rating,ha),rated_games=rated_games+1,updated_at=new.completed_at where user_id=new.host_id;
  update public.great_game_ratings set rating=ga,peak_rating=greatest(peak_rating,ga),rated_games=rated_games+1,updated_at=new.completed_at where user_id=new.guest_id;

  else
    select coalesce((select rating from public.great_game_ratings where user_id=new.host_id),1000) into hb;
    select coalesce((select rating from public.great_game_ratings where user_id=new.guest_id),1000) into gb;
    ha:=hb; ga:=gb;
  end if;
  insert into public.great_game_match_results(
    match_id,user_id,opponent_id,result,deck_name,faction,duration_seconds,turns,
    rating_before,rating_after,completed_at,standing_after,opponent_standing_after,match_type
  ) values
   (new.id,new.host_id,new.guest_id,hr,coalesce(nullif(new.host_deck_name,''),'Legacy Deck'),coalesce(nullif(new.host_faction,''),'mixed'),seconds_played,ht,hb,ha,new.completed_at,host_standing,guest_standing,new.match_type),
   (new.id,new.guest_id,new.host_id,gr,coalesce(nullif(new.guest_deck_name,''),'Legacy Deck'),coalesce(nullif(new.guest_faction,''),'mixed'),seconds_played,gt,gb,ga,new.completed_at,guest_standing,host_standing,new.match_type);
  return new;
end $$;


create or replace view public.great_game_ranked_stats with(security_barrier=true) as
with o as(
 select r.*,sum(case when result<>'win' then 1 else 0 end)over(partition by user_id order by completed_at desc,match_id desc) recent_break,
 sum(case when result<>'win' then 1 else 0 end)over(partition by user_id order by completed_at,match_id) streak_group
 from public.great_game_match_results r where match_type='ranked'),
s as(select user_id,streak_group,count(*)filter(where result='win')::integer streak from o group by user_id,streak_group)
select r.user_id,count(*)::integer games_played,count(*)filter(where result='win')::integer wins,count(*)filter(where result='loss')::integer losses,
 count(*)filter(where result='draw')::integer draws,count(*)filter(where result='abandon')::integer abandons,
 coalesce(round(100.0*count(*)filter(where result='win')/nullif(count(*)filter(where result in('win','loss','draw')),0),1),0) win_rate,
 count(*)filter(where result='win' and recent_break=0)::integer current_win_streak,
 coalesce((select max(s.streak)from s where s.user_id=r.user_id),0)::integer longest_win_streak,
 round(avg(duration_seconds))::integer average_duration_seconds,round(avg(turns),1) average_turns,max(completed_at) last_played_at
from o r group by r.user_id;


create or replace view public.great_game_leaderboard with(security_barrier=true) as
select row_number()over(order by rt.rating desc,coalesce(s.wins,0)desc,p.username)::integer rank,p.id user_id,p.username,p.display_name,p.avatar_url,
 rt.rating,rt.peak_rating,rt.rated_games,coalesce(s.games_played,0)games_played,coalesce(s.wins,0)wins,coalesce(s.losses,0)losses,
 coalesce(s.abandons,0)abandons,coalesce(s.win_rate,0)win_rate,coalesce(s.current_win_streak,0)current_win_streak
from public.great_game_ratings rt join public.profiles p on p.id=rt.user_id left join public.great_game_ranked_stats s on s.user_id=rt.user_id;


create or replace view public.great_game_match_history with(security_barrier=true) as
select r.match_id,r.user_id,r.opponent_id,p.username opponent_username,p.display_name opponent_display_name,p.avatar_url opponent_avatar_url,
 r.result,r.deck_name,r.faction,r.duration_seconds,r.turns,r.rating_before,r.rating_after,r.completed_at,
 r.standing_after,r.opponent_standing_after,r.match_type
from public.great_game_match_results r join public.profiles p on p.id=r.opponent_id;
-- Total and per-type counts use the same denominator. Abandonments count as losses.
create view public.great_game_type_stats with(security_barrier=true) as
select user_id,coalesce(match_type,'total') match_type,count(*)::integer games_played,
 count(*) filter(where result='win')::integer wins,
 count(*) filter(where result in('loss','abandon'))::integer losses,
 count(*) filter(where result='draw')::integer draws,
 count(*) filter(where result='abandon')::integer abandons,
 round(100.0*count(*) filter(where result='win')/count(*),1) win_rate
from public.great_game_match_results group by grouping sets((user_id,match_type),(user_id));
revoke all on public.great_game_ranked_stats,public.great_game_type_stats from public;
grant select on public.great_game_ranked_stats,public.great_game_type_stats,public.great_game_match_history,public.great_game_leaderboard to anon,authenticated;

create view public.great_game_deck_type_stats with(security_barrier=true) as
select user_id,deck_name,faction,coalesce(match_type,'total') match_type,count(*)::integer games_played,
 count(*) filter(where result='win')::integer wins,
 count(*) filter(where result in('loss','abandon'))::integer losses,
 count(*) filter(where result='draw')::integer draws,
 count(*) filter(where result='abandon')::integer abandons,
 round(100.0*count(*) filter(where result='win')/count(*),1) win_rate
from public.great_game_match_results group by grouping sets((user_id,deck_name,faction,match_type),(user_id,deck_name,faction));
revoke all on public.great_game_deck_type_stats from public;
grant select on public.great_game_deck_type_stats to anon,authenticated;

-- Real account ownership only. The catalog and deck rules remain unrestricted.
create table public.great_game_collection(
 user_id uuid not null references public.profiles(id) on delete cascade,
 card_id text not null check(length(card_id) between 1 and 160),
 quantity integer not null check(quantity>0),
 updated_at timestamptz not null default now(),
 primary key(user_id,card_id)
);
alter table public.great_game_collection enable row level security;
revoke all on public.great_game_collection from public,anon,authenticated;
grant select on public.great_game_collection to authenticated;
grant all on public.great_game_collection to service_role;
create policy collection_owner_read on public.great_game_collection for select to authenticated using((select auth.uid())=user_id);
-- Idempotent grants are reserved for future trusted fulfillment, never browser writes.
create table public.great_game_collection_grants(
 reference text primary key check(length(reference) between 1 and 200),
 user_id uuid not null references public.profiles(id) on delete cascade,
 card_id text not null, quantity integer not null check(quantity>0),
 created_at timestamptz not null default now()
);
alter table public.great_game_collection_grants enable row level security;
revoke all on public.great_game_collection_grants from public,anon,authenticated;
grant all on public.great_game_collection_grants to service_role;
create function public.grant_great_game_cards(p_reference text,p_user_id uuid,p_card_id text,p_quantity integer)
returns void language plpgsql security definer set search_path=public as $$
declare inserted integer;
begin
 insert into public.great_game_collection_grants(reference,user_id,card_id,quantity)
 values(p_reference,p_user_id,p_card_id,p_quantity) on conflict(reference) do nothing;
 get diagnostics inserted = row_count;
 if inserted=0 then
  if not exists(select 1 from public.great_game_collection_grants where reference=p_reference and user_id=p_user_id and card_id=p_card_id and quantity=p_quantity) then
   raise exception 'Grant reference already used for another award';
  end if;
  return;
 end if;
 insert into public.great_game_collection(user_id,card_id,quantity) values(p_user_id,p_card_id,p_quantity)
 on conflict(user_id,card_id) do update set quantity=great_game_collection.quantity+excluded.quantity,updated_at=now();
end $$;
revoke all on function public.grant_great_game_cards(text,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.grant_great_game_cards(text,uuid,text,integer) to service_role;
notify pgrst, 'reload schema';
commit;
