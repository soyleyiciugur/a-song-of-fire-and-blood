begin;

drop function if exists public.profile_reactions(uuid);

create function public.profile_reactions(member_id uuid)
returns table(
  target_kind text,
  target_id text,
  direction text,
  total bigint,
  latest timestamptz,
  href text,
  target_title text
)
language sql
stable
security invoker
set search_path=''
as $$
  with targets as (
    select
      'thread'::text as kind,
      t.id::text as target,
      t.user_author_id as author,
      '/forum?thread=' || t.id::text as link,
      t.title::text as label
    from public.forum_threads t
    where t.is_visible

    union all

    select
      'post'::text,
      p.id::text,
      p.user_author_id,
      '/forum?thread=' || p.thread_id::text || '&comment=' || p.id::text,
      coalesce(t.title, 'Taverns thread')::text
    from public.forum_posts p
    left join public.forum_threads t on t.id::text = p.thread_id::text
    where p.is_visible

    union all

    select
      'raven'::text,
      r.id::text,
      r.user_author_id,
      '/ravens-eye?item=' || r.entry_id || '&comment=' || r.id::text,
      'Raven''s Eye comment'::text
    from public.raven_comments r
    where r.is_visible
  ),
  events as (
    select l.target_kind, l.target_id, 'received'::text as direction,
           l.created_at, t.link, t.label
    from public.member_likes l
    join targets t on t.kind = l.target_kind and t.target = l.target_id
    where t.author = member_id and l.user_id <> member_id

    union all

    select l.target_kind, l.target_id, 'given'::text,
           l.created_at, t.link, t.label
    from public.member_likes l
    join targets t on t.kind = l.target_kind and t.target = l.target_id
    where l.user_id = member_id
  )
  select
    target_kind,
    target_id,
    direction,
    count(*) as total,
    max(created_at) as latest,
    link as href,
    max(label) as target_title
  from events
  group by target_kind, target_id, direction, link
  order by max(created_at) desc
  limit 30;
$$;

revoke all on function public.profile_reactions(uuid) from public;
grant execute on function public.profile_reactions(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
