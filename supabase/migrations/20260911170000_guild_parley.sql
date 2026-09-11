begin;

-- Guild Parley: multi-member conversations built on Direct Raven messaging.
alter table public.direct_raven_conversations
  alter column user_a drop not null,
  alter column user_b drop not null,
  add column if not exists kind text not null default 'raven',
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists avatar_path text,
  add column if not exists owner_id uuid references public.profiles(id) on delete set null;

alter table public.direct_raven_conversations
  add constraint direct_raven_kind_check check (kind in ('raven','guild')),
  add constraint direct_raven_shape_check check (
    (kind='raven' and user_a is not null and user_b is not null and user_a<>user_b)
    or
    (kind='guild' and user_a is null and user_b is null and owner_id is not null and char_length(trim(coalesce(title,''))) between 2 and 60)
  ),
  add constraint direct_raven_description_length check (description is null or char_length(description)<=500),
  add constraint direct_raven_avatar_path_length check (avatar_path is null or char_length(avatar_path)<=500);

create table public.direct_raven_members (
  conversation_id uuid not null references public.direct_raven_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('guildmaster','member')),
  joined_at timestamptz not null default now(),
  primary key (conversation_id,user_id)
);
create index direct_raven_members_user_idx on public.direct_raven_members(user_id,conversation_id);

insert into public.direct_raven_members(conversation_id,user_id,role,joined_at)
select id,user_a,'member',created_at from public.direct_raven_conversations where user_a is not null
on conflict do nothing;
insert into public.direct_raven_members(conversation_id,user_id,role,joined_at)
select id,user_b,'member',created_at from public.direct_raven_conversations where user_b is not null
on conflict do nothing;

alter table public.direct_raven_members enable row level security;

create or replace function public.is_direct_raven_participant(conversation_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1 from public.direct_raven_members m
    where m.conversation_id=conversation_uuid and m.user_id=auth.uid()
  );
$$;
revoke all on function public.is_direct_raven_participant(uuid) from public;
grant execute on function public.is_direct_raven_participant(uuid) to authenticated;

create policy direct_raven_members_read
on public.direct_raven_members for select to authenticated
using (public.is_direct_raven_participant(conversation_id));

create or replace function public.can_send_direct_raven(conversation_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1
    from public.direct_raven_conversations c
    where c.id=conversation_uuid
      and public.is_direct_raven_participant(c.id)
      and (
        c.kind='guild'
        or not exists(
          select 1 from public.direct_raven_blocks b
          where (b.blocker_id=c.user_a and b.blocked_id=c.user_b)
             or (b.blocker_id=c.user_b and b.blocked_id=c.user_a)
        )
      )
  );
$$;
revoke all on function public.can_send_direct_raven(uuid) from public;
grant execute on function public.can_send_direct_raven(uuid) to authenticated;

create or replace function public.start_direct_raven(target_username text)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  me uuid:=auth.uid();
  target uuid;
  conversation_uuid uuid;
begin
  if me is null then raise exception 'authentication_required'; end if;
  select p.id into target from public.profiles p where lower(p.username)=lower(trim(target_username));
  if target is null then raise exception 'recipient_not_found'; end if;
  if target=me then raise exception 'cannot_message_self'; end if;
  if exists(select 1 from public.direct_raven_blocks b where (b.blocker_id=me and b.blocked_id=target) or (b.blocker_id=target and b.blocked_id=me)) then
    raise exception 'direct_raven_blocked';
  end if;

  select c.id into conversation_uuid
  from public.direct_raven_conversations c
  where c.kind='raven' and ((c.user_a=me and c.user_b=target) or (c.user_a=target and c.user_b=me))
  limit 1;
  if conversation_uuid is not null then return conversation_uuid; end if;

  begin
    insert into public.direct_raven_conversations(user_a,user_b,kind)
    values(me,target,'raven') returning id into conversation_uuid;
  exception when unique_violation then
    select c.id into conversation_uuid
    from public.direct_raven_conversations c
    where c.kind='raven' and ((c.user_a=me and c.user_b=target) or (c.user_a=target and c.user_b=me))
    limit 1;
  end;

  insert into public.direct_raven_members(conversation_id,user_id,role)
  values(conversation_uuid,me,'member'),(conversation_uuid,target,'member')
  on conflict do nothing;
  return conversation_uuid;
end;
$$;
revoke all on function public.start_direct_raven(text) from public;
grant execute on function public.start_direct_raven(text) to authenticated;

create or replace function public.create_guild_parley(guild_name text,guild_description text,member_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  me uuid:=auth.uid();
  conversation_uuid uuid;
  clean_name text:=trim(guild_name);
  clean_description text:=nullif(trim(coalesce(guild_description,'')),'');
  target uuid;
begin
  if me is null then raise exception 'authentication_required'; end if;
  if char_length(clean_name) not between 2 and 60 then raise exception 'invalid_guild_name'; end if;
  if clean_description is not null and char_length(clean_description)>500 then raise exception 'guild_description_too_long'; end if;
  if coalesce(array_length(member_ids,1),0)<1 then raise exception 'guild_needs_members'; end if;

  insert into public.direct_raven_conversations(kind,title,description,owner_id)
  values('guild',clean_name,clean_description,me)
  returning id into conversation_uuid;

  insert into public.direct_raven_members(conversation_id,user_id,role)
  values(conversation_uuid,me,'guildmaster');

  for target in select distinct unnest(member_ids) loop
    if target<>me and exists(select 1 from public.profiles p where p.id=target) then
      insert into public.direct_raven_members(conversation_id,user_id,role)
      values(conversation_uuid,target,'member') on conflict do nothing;
    end if;
  end loop;

  if (select count(*) from public.direct_raven_members where conversation_id=conversation_uuid)<2 then
    raise exception 'guild_needs_members';
  end if;
  return conversation_uuid;
end;
$$;
revoke all on function public.create_guild_parley(text,text,uuid[]) from public;
grant execute on function public.create_guild_parley(text,text,uuid[]) to authenticated;

create or replace function public.update_guild_parley(conversation_uuid uuid,guild_name text,guild_description text,guild_avatar_path text)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare clean_name text:=trim(guild_name); clean_description text:=nullif(trim(coalesce(guild_description,'')),'');
begin
  if not exists(select 1 from public.direct_raven_conversations c where c.id=conversation_uuid and c.kind='guild' and c.owner_id=auth.uid()) then raise exception 'guildmaster_required'; end if;
  if char_length(clean_name) not between 2 and 60 then raise exception 'invalid_guild_name'; end if;
  if clean_description is not null and char_length(clean_description)>500 then raise exception 'guild_description_too_long'; end if;
  update public.direct_raven_conversations set title=clean_name,description=clean_description,avatar_path=nullif(trim(coalesce(guild_avatar_path,'')),''),updated_at=now() where id=conversation_uuid;
end;
$$;
revoke all on function public.update_guild_parley(uuid,text,text,text) from public;
grant execute on function public.update_guild_parley(uuid,text,text,text) to authenticated;

create or replace function public.add_guild_member(conversation_uuid uuid,target_username text)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare target uuid;
begin
  if not exists(select 1 from public.direct_raven_conversations c where c.id=conversation_uuid and c.kind='guild' and c.owner_id=auth.uid()) then raise exception 'guildmaster_required'; end if;
  select p.id into target from public.profiles p where lower(p.username)=lower(trim(leading '@' from target_username));
  if target is null then raise exception 'recipient_not_found'; end if;
  insert into public.direct_raven_members(conversation_id,user_id,role) values(conversation_uuid,target,'member') on conflict do nothing;
  return target;
end;
$$;
revoke all on function public.add_guild_member(uuid,text) from public;
grant execute on function public.add_guild_member(uuid,text) to authenticated;

create or replace function public.remove_guild_member(conversation_uuid uuid,target_user uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if not exists(select 1 from public.direct_raven_conversations c where c.id=conversation_uuid and c.kind='guild' and c.owner_id=auth.uid()) then raise exception 'guildmaster_required'; end if;
  if target_user=auth.uid() then raise exception 'use_leave_guild'; end if;
  delete from public.direct_raven_members where conversation_id=conversation_uuid and user_id=target_user;
end;
$$;
revoke all on function public.remove_guild_member(uuid,uuid) from public;
grant execute on function public.remove_guild_member(uuid,uuid) to authenticated;

create or replace function public.leave_guild_parley(conversation_uuid uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  me uuid:=auth.uid();
  next_master uuid;
  is_master boolean;
begin
  if not exists(select 1 from public.direct_raven_members m join public.direct_raven_conversations c on c.id=m.conversation_id where m.conversation_id=conversation_uuid and m.user_id=me and c.kind='guild') then raise exception 'not_a_member'; end if;
  select exists(select 1 from public.direct_raven_conversations c where c.id=conversation_uuid and c.owner_id=me) into is_master;
  if is_master then
    select m.user_id into next_master from public.direct_raven_members m where m.conversation_id=conversation_uuid and m.user_id<>me order by m.joined_at,m.user_id limit 1;
    if next_master is null then
      delete from public.direct_raven_conversations where id=conversation_uuid;
      return;
    end if;
    update public.direct_raven_conversations set owner_id=next_master where id=conversation_uuid;
    update public.direct_raven_members set role='guildmaster' where conversation_id=conversation_uuid and user_id=next_master;
  end if;
  delete from public.direct_raven_members where conversation_id=conversation_uuid and user_id=me;
end;
$$;
revoke all on function public.leave_guild_parley(uuid) from public;
grant execute on function public.leave_guild_parley(uuid) to authenticated;

create or replace function public.direct_raven_summaries()
returns table(conversation_id uuid,last_message jsonb,unread bigint)
language sql stable security invoker set search_path='' as $$
  select c.id,latest.message,(
    select count(*) from public.direct_raven_messages m
    where m.conversation_id=c.id and m.sender_id<>auth.uid() and m.deleted_at is null
      and m.created_at>coalesce(r.last_read_at,'-infinity'::timestamptz)
  )
  from public.direct_raven_conversations c
  join public.direct_raven_members mine on mine.conversation_id=c.id and mine.user_id=auth.uid()
  left join public.direct_raven_reads r on r.conversation_id=c.id and r.user_id=auth.uid()
  left join lateral(
    select to_jsonb(m) message from public.direct_raven_messages m
    where m.conversation_id=c.id order by m.created_at desc,m.id desc limit 1
  ) latest on true;
$$;

create or replace function public.direct_raven_unread_count()
returns bigint
language sql stable security definer set search_path='' as $$
  select count(*)::bigint
  from public.direct_raven_messages m
  join public.direct_raven_members mine on mine.conversation_id=m.conversation_id and mine.user_id=auth.uid()
  left join public.direct_raven_reads r on r.conversation_id=m.conversation_id and r.user_id=auth.uid()
  where m.sender_id<>auth.uid() and m.deleted_at is null and m.created_at>coalesce(r.last_read_at,'-infinity'::timestamptz);
$$;
revoke all on function public.direct_raven_unread_count() from public;
grant execute on function public.direct_raven_unread_count() to authenticated;

notify pgrst,'reload schema';
commit;
