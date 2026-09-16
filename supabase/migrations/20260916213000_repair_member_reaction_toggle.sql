begin;

-- Keep reaction validation compatible with both database-backed community
-- content and static/generated targets registered in community_reaction_targets.
create or replace function public.can_read_like_target(kind text, target text)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
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
      exists(
        select 1
        from public.direct_raven_messages m
        join public.direct_raven_conversations c on c.id=m.conversation_id
        where m.id::text=target
          and m.deleted_at is null
          and auth.uid() in (c.user_a,c.user_b)
      )
    else false
  end;
$$;

revoke all on function public.can_read_like_target(text,text) from public;
grant execute on function public.can_read_like_target(text,text) to anon, authenticated;

-- Recreate the RPC as well so databases that received only part of the earlier
-- reaction migrations cannot leave the client calling an outdated function.
create or replace function public.toggle_member_reaction(kind text, target text)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid := auth.uid();
  already boolean;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if not public.can_read_like_target(kind,target) then
    raise exception 'invalid_reaction_target';
  end if;

  select exists(
    select 1 from public.member_likes
    where user_id=uid and target_kind=kind and target_id=target
  ) into already;

  if already then
    delete from public.member_likes
    where user_id=uid and target_kind=kind and target_id=target;
    return false;
  end if;

  insert into public.member_likes(user_id,target_kind,target_id)
  values(uid,kind,target)
  on conflict(user_id,target_kind,target_id) do nothing;

  return true;
end;
$$;

revoke all on function public.toggle_member_reaction(text,text) from public;
grant execute on function public.toggle_member_reaction(text,text) to authenticated;

commit;
