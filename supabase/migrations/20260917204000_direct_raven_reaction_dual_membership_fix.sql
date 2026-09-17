begin;

-- Message reaction authorization must support both conversation shapes:
-- current Guild/Raven membership rows and legacy two-person user_a/user_b Ravens.
-- Some valid existing Raven conversations can lack a direct_raven_members row,
-- so requiring that table alone makes set_message_reaction reject them.
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
          and (
            exists(
              select 1 from public.direct_raven_members drm
              where drm.conversation_id=m.conversation_id
                and drm.user_id=auth.uid()
            )
            or (c.kind='raven' and auth.uid() in (c.user_a,c.user_b))
          )
      )
    else false
  end;
$$;

revoke all on function public.can_read_like_target(text,text) from public;
grant execute on function public.can_read_like_target(text,text) to anon,authenticated;

-- Repair missing membership rows for legacy/current two-person Ravens as well,
-- so subsequent reads and other Direct Raven features use the canonical table.
insert into public.direct_raven_members(conversation_id,user_id,role,joined_at)
select c.id,c.user_a,'member',c.created_at
from public.direct_raven_conversations c
where c.kind='raven' and c.user_a is not null
on conflict do nothing;

insert into public.direct_raven_members(conversation_id,user_id,role,joined_at)
select c.id,c.user_b,'member',c.created_at
from public.direct_raven_conversations c
where c.kind='raven' and c.user_b is not null
on conflict do nothing;

notify pgrst,'reload schema';
commit;
