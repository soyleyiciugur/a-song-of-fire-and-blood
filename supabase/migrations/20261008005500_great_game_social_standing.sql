alter table public.great_game_match_results
  add column if not exists standing_after integer,
  add column if not exists opponent_standing_after integer;

update public.great_game_match_results r
set
  standing_after = case
    when r.user_id = m.host_id then nullif(m.state #>> '{players,player1,standing}', '')::integer
    when r.user_id = m.guest_id then nullif(m.state #>> '{players,player2,standing}', '')::integer
    else r.standing_after
  end,
  opponent_standing_after = case
    when r.user_id = m.host_id then nullif(m.state #>> '{players,player2,standing}', '')::integer
    when r.user_id = m.guest_id then nullif(m.state #>> '{players,player1,standing}', '')::integer
    else r.opponent_standing_after
  end
from public.great_game_matches m
where r.match_id = m.id
  and m.state is not null
  and (r.standing_after is null or r.opponent_standing_after is null);

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

  insert into public.great_game_ratings(user_id) values(new.host_id),(new.guest_id) on conflict(user_id) do nothing;
  select rating into hb from public.great_game_ratings where user_id=new.host_id for update;
  select rating into gb from public.great_game_ratings where user_id=new.guest_id for update;
  hs:=case when hr='win' then 1 when hr='draw' then .5 else 0 end;
  expected:=1.0/(1.0+power(10.0,(gb-hb)/400.0));
  ha:=greatest(0,round(hb+32*(hs-expected))::integer);
  ga:=greatest(0,gb+(hb-ha));
  update public.great_game_ratings set rating=ha,peak_rating=greatest(peak_rating,ha),rated_games=rated_games+1,updated_at=new.completed_at where user_id=new.host_id;
  update public.great_game_ratings set rating=ga,peak_rating=greatest(peak_rating,ga),rated_games=rated_games+1,updated_at=new.completed_at where user_id=new.guest_id;

  insert into public.great_game_match_results(
    match_id,user_id,opponent_id,result,deck_name,faction,duration_seconds,turns,
    rating_before,rating_after,completed_at,standing_after,opponent_standing_after
  ) values
   (new.id,new.host_id,new.guest_id,hr,coalesce(nullif(new.host_deck_name,''),'Legacy Deck'),coalesce(nullif(new.host_faction,''),'mixed'),seconds_played,ht,hb,ha,new.completed_at,host_standing,guest_standing),
   (new.id,new.guest_id,new.host_id,gr,coalesce(nullif(new.guest_deck_name,''),'Legacy Deck'),coalesce(nullif(new.guest_faction,''),'mixed'),seconds_played,gt,gb,ga,new.completed_at,guest_standing,host_standing);
  return new;
end $$;

create or replace view public.great_game_match_history with(security_barrier=true) as
select r.match_id,r.user_id,r.opponent_id,p.username opponent_username,p.display_name opponent_display_name,p.avatar_url opponent_avatar_url,
 r.result,r.deck_name,r.faction,r.duration_seconds,r.turns,r.rating_before,r.rating_after,r.completed_at,
 r.standing_after,r.opponent_standing_after
from public.great_game_match_results r join public.profiles p on p.id=r.opponent_id;

grant select on public.great_game_match_history to anon,authenticated;
