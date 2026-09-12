begin;

-- The reaction toggle executes as the function owner. Private message targets
-- therefore need an explicit participant check, not only table visibility.
create or replace function public.can_read_like_target(kind text, target text)
returns boolean language sql stable security definer set search_path='' as $$
  select case kind
    when 'thread' then
      exists(select 1 from public.forum_threads where id::text=target and is_visible)
      or exists(select 1 from public.community_reaction_targets where target_kind='thread' and target_id=target)
    when 'post' then
      exists(select 1 from public.forum_posts where id::text=target and is_visible)
      or exists(select 1 from public.community_reaction_targets where target_kind='post' and target_id=target)
    when 'raven' then
      exists(select 1 from public.raven_comments where id::text=target and is_visible)
      or exists(select 1 from public.community_reaction_targets where target_kind='raven' and target_id=target)
    when 'message' then
      exists(select 1 from public.direct_raven_messages m
        join public.direct_raven_conversations c on c.id=m.conversation_id
        where m.id::text=target and m.deleted_at is null and auth.uid() in (c.user_a,c.user_b))
    else false
  end;
$$;
revoke all on function public.can_read_like_target(text,text) from public;
grant execute on function public.can_read_like_target(text,text) to anon,authenticated;

commit;
