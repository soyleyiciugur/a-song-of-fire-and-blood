alter table public.great_game_matches
  add column if not exists started_at timestamptz,
  add column if not exists host_deck_name text,
  add column if not exists guest_deck_name text,
  add column if not exists host_faction text,
  add column if not exists guest_faction text;

create table if not exists public.great_game_ratings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  rating integer not null default 1000 check (rating >= 0),
  peak_rating integer not null default 1000 check (peak_rating >= 0),
  rated_games integer not null default 0 check (rated_games >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.great_game_match_results (
  match_id uuid not null references public.great_game_matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  opponent_id uuid not null references public.profiles(id) on delete cascade,
  result text not null check (result in ('win','loss','draw','abandon')),
  deck_name text not null default 'Legacy Deck',
  faction text not null default 'mixed',
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  turns integer not null default 0 check (turns >= 0),
  rating_before integer not null default 1000,
  rating_after integer not null default 1000,
  completed_at timestamptz not null,
  primary key (match_id,user_id)
);

create index if not exists great_game_results_user_completed_idx on public.great_game_match_results(user_id,completed_at desc);
create index if not exists great_game_results_opponent_idx on public.great_game_match_results(user_id,opponent_id,completed_at desc);
alter table public.great_game_ratings enable row level security;
alter table public.great_game_match_results enable row level security;
revoke all on public.great_game_ratings,public.great_game_match_results from anon,authenticated;

create or replace function public.record_great_game_result()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  hr text; gr text; hb integer; gb integer; ha integer; ga integer;
  hs numeric; expected numeric;
  seconds_played integer := greatest(0,extract(epoch from (new.completed_at-coalesce(new.started_at,new.created_at)))::integer);
  ht integer := coalesce((new.state->'players'->'player1'->>'turnsTaken')::integer,0);
  gt integer := coalesce((new.state->'players'->'player2'->>'turnsTaken')::integer,0);
begin
  if new.guest_id is null or new.completed_at is null or new.status not in ('finished','abandoned') then return new; end if;
  if exists(select 1 from public.great_game_match_results where match_id=new.id) then return new; end if;
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
  insert into public.great_game_match_results(match_id,user_id,opponent_id,result,deck_name,faction,duration_seconds,turns,rating_before,rating_after,completed_at) values
   (new.id,new.host_id,new.guest_id,hr,coalesce(nullif(new.host_deck_name,''),'Legacy Deck'),coalesce(nullif(new.host_faction,''),'mixed'),seconds_played,ht,hb,ha,new.completed_at),
   (new.id,new.guest_id,new.host_id,gr,coalesce(nullif(new.guest_deck_name,''),'Legacy Deck'),coalesce(nullif(new.guest_faction,''),'mixed'),seconds_played,gt,gb,ga,new.completed_at);
  return new;
end $$;

drop trigger if exists great_game_record_result on public.great_game_matches;
create trigger great_game_record_result after insert or update of status on public.great_game_matches for each row execute function public.record_great_game_result();
do $$ declare historical_match uuid;
begin
  for historical_match in
    select id from public.great_game_matches
    where guest_id is not null and completed_at is not null and status in ('finished','abandoned')
    order by completed_at,id
  loop
    update public.great_game_matches set status=status where id=historical_match;
  end loop;
end $$;

drop view if exists public.great_game_leaderboard;
drop view if exists public.great_game_match_history;
drop view if exists public.great_game_head_to_head;
drop view if exists public.great_game_deck_stats;
drop view if exists public.great_game_player_stats;

create view public.great_game_player_stats with(security_barrier=true) as
with o as(
 select r.*,sum(case when result<>'win' then 1 else 0 end)over(partition by user_id order by completed_at desc,match_id desc) recent_break,
 sum(case when result<>'win' then 1 else 0 end)over(partition by user_id order by completed_at,match_id) streak_group
 from public.great_game_match_results r),
s as(select user_id,streak_group,count(*)filter(where result='win')::integer streak from o group by user_id,streak_group)
select r.user_id,count(*)::integer games_played,count(*)filter(where result='win')::integer wins,count(*)filter(where result='loss')::integer losses,
 count(*)filter(where result='draw')::integer draws,count(*)filter(where result='abandon')::integer abandons,
 coalesce(round(100.0*count(*)filter(where result='win')/nullif(count(*)filter(where result in('win','loss','draw')),0),1),0) win_rate,
 count(*)filter(where result='win' and recent_break=0)::integer current_win_streak,
 coalesce((select max(s.streak)from s where s.user_id=r.user_id),0)::integer longest_win_streak,
 round(avg(duration_seconds))::integer average_duration_seconds,round(avg(turns),1) average_turns,max(completed_at) last_played_at
from o r group by r.user_id;

create or replace view public.great_game_deck_stats with(security_barrier=true) as
select user_id,deck_name,faction,count(*)::integer games_played,count(*)filter(where result='win')::integer wins,
 count(*)filter(where result='loss')::integer losses,count(*)filter(where result='abandon')::integer abandons,
 coalesce(round(100.0*count(*)filter(where result='win')/nullif(count(*)filter(where result in('win','loss','draw')),0),1),0) win_rate
from public.great_game_match_results group by user_id,deck_name,faction;

create or replace view public.great_game_head_to_head with(security_barrier=true) as
select r.user_id,r.opponent_id,p.username opponent_username,p.display_name opponent_display_name,count(*)::integer games_played,
 count(*)filter(where result='win')::integer wins,count(*)filter(where result='loss')::integer losses,count(*)filter(where result='abandon')::integer abandons,max(r.completed_at)last_played_at
from public.great_game_match_results r join public.profiles p on p.id=r.opponent_id group by r.user_id,r.opponent_id,p.username,p.display_name;

create or replace view public.great_game_match_history with(security_barrier=true) as
select r.match_id,r.user_id,r.opponent_id,p.username opponent_username,p.display_name opponent_display_name,p.avatar_url opponent_avatar_url,
 r.result,r.deck_name,r.faction,r.duration_seconds,r.turns,r.rating_before,r.rating_after,r.completed_at
from public.great_game_match_results r join public.profiles p on p.id=r.opponent_id;

create or replace view public.great_game_leaderboard with(security_barrier=true) as
select row_number()over(order by rt.rating desc,coalesce(s.wins,0)desc,p.username)::integer rank,p.id user_id,p.username,p.display_name,p.avatar_url,
 rt.rating,rt.peak_rating,rt.rated_games,coalesce(s.games_played,0)games_played,coalesce(s.wins,0)wins,coalesce(s.losses,0)losses,
 coalesce(s.abandons,0)abandons,coalesce(s.win_rate,0)win_rate,coalesce(s.current_win_streak,0)current_win_streak
from public.great_game_ratings rt join public.profiles p on p.id=rt.user_id left join public.great_game_player_stats s on s.user_id=rt.user_id;

revoke all on public.great_game_player_stats,public.great_game_deck_stats,public.great_game_head_to_head,public.great_game_match_history,public.great_game_leaderboard from public;
grant select on public.great_game_player_stats,public.great_game_deck_stats,public.great_game_head_to_head,public.great_game_match_history,public.great_game_leaderboard to anon,authenticated;
