-- Assignments are persisted in match state at creation, never inferred for old games.
-- Match results remain the single source of outcomes, including abandon handling.
create or replace view public.great_game_supporter_stats with (security_barrier=true) as
with assigned as (
  select r.user_id, r.result,
    m.state->'supporters'->>(case when r.user_id=m.host_id then 'player1' else 'player2' end) supporter
  from public.great_game_match_results r
  join public.great_game_matches m on m.id=r.match_id
)
select user_id, supporter,
  count(*)::integer games_played,
  count(*) filter(where result='win')::integer wins,
  count(*) filter(where result='loss')::integer losses,
  count(*) filter(where result='draw')::integer draws,
  count(*) filter(where result='abandon')::integer abandons,
  coalesce(round(100.0*count(*) filter(where result='win') /
    nullif(count(*) filter(where result in ('win','loss','draw')),0),1),0) win_rate
from assigned
where supporter in ('mara','aldren')
group by user_id,supporter;

revoke all on public.great_game_supporter_stats from public;
grant select on public.great_game_supporter_stats to anon,authenticated;
