begin;

-- Generated for the two new fictional replies in the HRRM AMA.
insert into public.community_reaction_targets (target_kind,target_id,href,thread_id,thread_title)
values
  ('post','live-hrrm-ama-tears-club','/forum?thread=c774865d-28f3-4cd5-abc0-657227dc44c6&comment=live-hrrm-ama-tears-club','c774865d-28f3-4cd5-abc0-657227dc44c6','HRRM AMA'),
  ('post','live-hrrm-ama-blindside-critic','/forum?thread=c774865d-28f3-4cd5-abc0-657227dc44c6&comment=live-hrrm-ama-blindside-critic','c774865d-28f3-4cd5-abc0-657227dc44c6','HRRM AMA')
on conflict (target_kind,target_id) do update set
  href=excluded.href, thread_id=excluded.thread_id, thread_title=excluded.thread_title;

commit;