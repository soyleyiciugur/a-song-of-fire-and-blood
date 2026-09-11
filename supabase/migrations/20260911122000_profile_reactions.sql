create function public.profile_reactions(member_id uuid)
returns table(target_kind text,target_id text,direction text,total bigint,latest timestamptz,href text)
language sql stable security invoker set search_path='' as $$
 with targets as (
 select 'thread'::text kind,id::text target,user_author_id author,'/forum?thread='||id::text link from public.forum_threads where is_visible
 union all select 'post',id::text,user_author_id,'/forum?thread='||thread_id::text||'&comment='||id::text from public.forum_posts where is_visible
 union all select 'raven',id::text,user_author_id,'/ravens-eye?item='||entry_id||'&comment='||id::text from public.raven_comments where is_visible
 ), events as (
 select l.target_kind,l.target_id,'received'::text direction,l.created_at,t.link from public.member_likes l join targets t on t.kind=l.target_kind and t.target=l.target_id where t.author=member_id and l.user_id<>member_id
 union all
 select l.target_kind,l.target_id,'given',l.created_at,t.link from public.member_likes l join targets t on t.kind=l.target_kind and t.target=l.target_id where l.user_id=member_id
 ) select target_kind,target_id,direction,count(*),max(created_at),link from events group by target_kind,target_id,direction,link order by max(created_at) desc limit 30;
$$;
revoke all on function public.profile_reactions(uuid) from public;
grant execute on function public.profile_reactions(uuid) to anon,authenticated;
notify pgrst,'reload schema';
