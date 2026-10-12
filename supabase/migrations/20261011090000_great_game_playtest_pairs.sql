begin;
lock table public.great_game_matches, public.great_game_match_results, public.great_game_ratings in share row exclusive mode;
-- Persist account IDs so renaming either account does not re-enable test results.
create table public.great_game_playtest_pairs (
  player_a uuid not null references public.profiles(id),
  player_b uuid not null references public.profiles(id),
  primary key(player_a,player_b), check(player_a < player_b)
);
alter table public.great_game_playtest_pairs enable row level security;
revoke all on public.great_game_playtest_pairs from public,anon,authenticated;
insert into public.great_game_playtest_pairs
select least(a.id,b.id),greatest(a.id,b.id) from public.profiles a cross join public.profiles b
where lower(a.username)='luck' and lower(b.username)='luck_ii';
do $$ begin
 if (select count(*) from public.great_game_playtest_pairs)<>1 then
   raise exception 'Expected exactly one luck/luck_ii account pair';
 end if;
end $$;
create function public.is_great_game_playtest(a uuid,b uuid) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.great_game_playtest_pairs where player_a=least(a,b) and player_b=greatest(a,b))
$$;
revoke all on function public.is_great_game_playtest(uuid,uuid) from public,anon,authenticated;
drop trigger great_game_record_result on public.great_game_matches;
create trigger great_game_record_result after insert or update of status on public.great_game_matches
for each row when (not public.is_great_game_playtest(new.host_id,new.guest_id))
execute function public.record_great_game_result();
-- Keep table state/replays, but remove test outcomes from every derived view.
do $$
declare removed integer; m record; hb integer; gb integer; ha integer; ga integer; score numeric;
begin
 delete from public.great_game_match_results where public.is_great_game_playtest(user_id,opponent_id);
 get diagnostics removed = row_count;
 if removed=0 then return; end if;
 -- Later opponents depend on earlier Elo: replay all retained rated outcomes chronologically.
 delete from public.great_game_ratings;
 for m in select r.match_id,r.user_id host_id,r.opponent_id guest_id,r.result,r.completed_at
   from public.great_game_match_results r join public.great_game_matches t on t.id=r.match_id
   where r.match_type='ranked' and r.user_id=t.host_id order by r.completed_at,r.match_id
 loop
   insert into public.great_game_ratings(user_id) values(m.host_id),(m.guest_id) on conflict do nothing;
   select rating into hb from public.great_game_ratings where user_id=m.host_id;
   select rating into gb from public.great_game_ratings where user_id=m.guest_id;
   score:=case when m.result='win' then 1 when m.result='draw' then .5 else 0 end;
   ha:=greatest(0,round(hb+32*(score-1.0/(1.0+power(10.0,(gb-hb)/400.0))))::integer);
   ga:=greatest(0,gb+hb-ha);
   update public.great_game_match_results set rating_before=case when user_id=m.host_id then hb else gb end,
     rating_after=case when user_id=m.host_id then ha else ga end where match_id=m.match_id;
   update public.great_game_ratings set rating=ha,peak_rating=greatest(peak_rating,ha),rated_games=rated_games+1,updated_at=m.completed_at where user_id=m.host_id;
   update public.great_game_ratings set rating=ga,peak_rating=greatest(peak_rating,ga),rated_games=rated_games+1,updated_at=m.completed_at where user_id=m.guest_id;
 end loop;
 -- Friendly history carries a snapshot, not an Elo change.
 update public.great_game_match_results c set rating_before=coalesce((select r.rating_after from public.great_game_match_results r where r.user_id=c.user_id and r.match_type='ranked' and (r.completed_at,r.match_id)<=(c.completed_at,c.match_id) order by r.completed_at desc,r.match_id desc limit 1),1000),
 rating_after=coalesce((select r.rating_after from public.great_game_match_results r where r.user_id=c.user_id and r.match_type='ranked' and (r.completed_at,r.match_id)<=(c.completed_at,c.match_id) order by r.completed_at desc,r.match_id desc limit 1),1000)
 where c.match_type='custom';
end $$;
commit;
