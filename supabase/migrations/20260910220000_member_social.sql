begin;

alter table public.profiles add column banner_url text;
alter table public.direct_raven_messages add column attachment_path text;
alter table public.direct_raven_messages add column reply_to uuid references public.direct_raven_messages(id) on delete set null;
alter table public.direct_raven_messages drop constraint direct_raven_message_length;
alter table public.direct_raven_messages add constraint direct_raven_message_length
  check (char_length(body) <= 4000 and (char_length(trim(body)) > 0 or attachment_path is not null));

create or replace function public.validate_raven_extras() returns trigger language plpgsql set search_path='' as $$
begin
  if new.attachment_path is not null and new.attachment_path not like new.conversation_id::text || '/' || new.sender_id::text || '/%' then
    raise exception 'invalid_attachment_path';
  end if;
  if new.reply_to is not null and not exists(select 1 from public.direct_raven_messages m where m.id=new.reply_to and m.conversation_id=new.conversation_id) then
    raise exception 'invalid_reply';
  end if;
  if TG_OP='UPDATE' then
    if new.attachment_path is distinct from old.attachment_path or new.reply_to is distinct from old.reply_to then raise exception 'protected_attachment_fields'; end if;
    if old.deleted_at is not null and (new.body is distinct from old.body or new.deleted_at is distinct from old.deleted_at) then raise exception 'raven_already_withdrawn'; end if;
    if new.body is distinct from old.body and not public.can_send_direct_raven(new.conversation_id) then raise exception 'direct_raven_blocked'; end if;
  end if;
  return new;
end $$;
create trigger validate_raven_extras before insert or update on public.direct_raven_messages for each row execute function public.validate_raven_extras();

create policy direct_raven_reads_participants on public.direct_raven_reads for select to authenticated
using (public.is_direct_raven_participant(conversation_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('raven-media','raven-media',false,8388608,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do nothing;
create policy raven_media_read on storage.objects for select to authenticated using (
  bucket_id='raven-media' and exists(select 1 from public.direct_raven_conversations c where c.id::text=(storage.foldername(name))[1] and public.is_direct_raven_participant(c.id))
);
create policy raven_media_insert on storage.objects for insert to authenticated with check (
  bucket_id='raven-media' and (storage.foldername(name))[2]=auth.uid()::text
  and exists(select 1 from public.direct_raven_conversations c where c.id::text=(storage.foldername(name))[1] and public.can_send_direct_raven(c.id))
);
create policy raven_media_delete on storage.objects for delete to authenticated using(bucket_id='raven-media' and owner_id=auth.uid()::text);

create or replace function public.validate_profile_banner() returns trigger language plpgsql set search_path='' as $$
begin
  if new.banner_url is not null and position('/avatars/' || new.id::text || '/' in new.banner_url)=0 then raise exception 'invalid_banner_path'; end if;
  return new;
end $$;
create trigger validate_profile_banner before update on public.profiles for each row execute function public.validate_profile_banner();

create table public.member_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  check(requester_id<>recipient_id)
);
create unique index member_friendships_pair on public.member_friendships(least(requester_id,recipient_id),greatest(requester_id,recipient_id));
alter table public.member_friendships enable row level security;
create policy friends_read on public.member_friendships for select to authenticated using(accepted_at is not null or auth.uid() in(requester_id,recipient_id));
create policy friends_request on public.member_friendships for insert to authenticated with check (
  requester_id=auth.uid() and accepted_at is null and not exists(select 1 from public.direct_raven_blocks b where (b.blocker_id=requester_id and b.blocked_id=recipient_id) or (b.blocker_id=recipient_id and b.blocked_id=requester_id))
);
create policy friends_accept on public.member_friendships for update to authenticated using(recipient_id=auth.uid() and accepted_at is null) with check(recipient_id=auth.uid() and accepted_at is not null);
create policy friends_remove on public.member_friendships for delete to authenticated using(auth.uid() in(requester_id,recipient_id));
create function public.protect_friendship() returns trigger language plpgsql set search_path='' as $$
begin
  if new.id<>old.id or new.requester_id<>old.requester_id or new.recipient_id<>old.recipient_id or new.created_at<>old.created_at then raise exception 'protected_friendship_fields'; end if;
  new.accepted_at:=now(); return new;
end $$;
create trigger protect_friendship before update on public.member_friendships for each row execute function public.protect_friendship();

create table public.member_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_kind text not null check(target_kind in('thread','post','raven','message')),
  target_id text not null check(char_length(target_id) between 1 and 160),
  created_at timestamptz not null default now(),
  primary key(user_id,target_kind,target_id)
);
create index member_likes_target on public.member_likes(target_kind,target_id);
alter table public.member_likes enable row level security;
create function public.can_read_like_target(kind text, target text) returns boolean language sql stable security invoker set search_path='' as $$
  select case kind
    when 'thread' then exists(select 1 from public.forum_threads where id::text=target and is_visible)
    when 'post' then exists(select 1 from public.forum_posts where id::text=target and is_visible)
    when 'raven' then exists(select 1 from public.raven_comments where id::text=target and is_visible)
    when 'message' then exists(select 1 from public.direct_raven_messages where id::text=target and deleted_at is null)
    else false end;
$$;
revoke all on function public.can_read_like_target(text,text) from public;
grant execute on function public.can_read_like_target(text,text) to anon,authenticated;
create policy likes_read on public.member_likes for select using(public.can_read_like_target(target_kind,target_id));
create policy likes_insert on public.member_likes for insert to authenticated with check(user_id=auth.uid() and public.can_read_like_target(target_kind,target_id));
create policy likes_delete on public.member_likes for delete to authenticated using(user_id=auth.uid());

create function public.member_like_counts(kind text,targets text[])
returns table(target_id text,total bigint,liked boolean)
language sql stable security invoker set search_path='' as $$
  select l.target_id,count(*),coalesce(bool_or(l.user_id=auth.uid()),false)
  from public.member_likes l where l.target_kind=kind and l.target_id=any(targets)
  group by l.target_id;
$$;
revoke all on function public.member_like_counts(text,text[]) from public;
grant execute on function public.member_like_counts(text,text[]) to anon,authenticated;

-- Summarize in PostgreSQL instead of downloading the entire private message history.
create function public.direct_raven_summaries()
returns table(conversation_id uuid,last_message jsonb,unread bigint)
language sql stable security invoker set search_path='' as $$
  select c.id, latest.message, (
    select count(*) from public.direct_raven_messages m
    where m.conversation_id=c.id and m.sender_id<>auth.uid() and m.deleted_at is null
      and m.created_at>coalesce(r.last_read_at,'-infinity'::timestamptz)
  )
  from public.direct_raven_conversations c
  left join public.direct_raven_reads r on r.conversation_id=c.id and r.user_id=auth.uid()
  left join lateral (
    select to_jsonb(m) message from public.direct_raven_messages m
    where m.conversation_id=c.id order by m.created_at desc,m.id desc limit 1
  ) latest on true
  where auth.uid() in(c.user_a,c.user_b);
$$;
revoke all on function public.direct_raven_summaries() from public;
grant execute on function public.direct_raven_summaries() to authenticated;
notify pgrst,'reload schema';
commit;
