begin;

-- Direct Raven: private one-to-one messaging between real authenticated users.
-- In-world character/legacy authorship is intentionally not supported here.

create table public.direct_raven_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint direct_raven_distinct_users check (user_a <> user_b)
);

create unique index direct_raven_unique_pair
  on public.direct_raven_conversations (least(user_a, user_b), greatest(user_a, user_b));
create index direct_raven_user_a_updated on public.direct_raven_conversations (user_a, updated_at desc);
create index direct_raven_user_b_updated on public.direct_raven_conversations (user_b, updated_at desc);

create table public.direct_raven_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_raven_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  constraint direct_raven_message_length check (char_length(body) between 1 and 4000)
);
create index direct_raven_messages_conversation_created
  on public.direct_raven_messages (conversation_id, created_at);

create table public.direct_raven_reads (
  conversation_id uuid not null references public.direct_raven_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.direct_raven_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint direct_raven_no_self_block check (blocker_id <> blocked_id)
);
create index direct_raven_blocks_blocked_idx on public.direct_raven_blocks (blocked_id);

alter table public.direct_raven_conversations enable row level security;
alter table public.direct_raven_messages enable row level security;
alter table public.direct_raven_reads enable row level security;
alter table public.direct_raven_blocks enable row level security;

create or replace function public.is_direct_raven_participant(conversation_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.direct_raven_conversations c
    where c.id = conversation_uuid
      and auth.uid() in (c.user_a, c.user_b)
  );
$$;
revoke all on function public.is_direct_raven_participant(uuid) from public;
grant execute on function public.is_direct_raven_participant(uuid) to authenticated;

create or replace function public.can_send_direct_raven(conversation_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.direct_raven_conversations c
    where c.id = conversation_uuid
      and auth.uid() in (c.user_a, c.user_b)
      and not exists (
        select 1
        from public.direct_raven_blocks b
        where (b.blocker_id = c.user_a and b.blocked_id = c.user_b)
           or (b.blocker_id = c.user_b and b.blocked_id = c.user_a)
      )
  );
$$;
revoke all on function public.can_send_direct_raven(uuid) from public;
grant execute on function public.can_send_direct_raven(uuid) to authenticated;

create policy direct_raven_conversations_read
on public.direct_raven_conversations for select to authenticated
using (public.is_direct_raven_participant(id));

create policy direct_raven_messages_read
on public.direct_raven_messages for select to authenticated
using (public.is_direct_raven_participant(conversation_id));

create policy direct_raven_messages_insert
on public.direct_raven_messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and public.can_send_direct_raven(conversation_id)
  and deleted_at is null
);

create policy direct_raven_messages_update_own
on public.direct_raven_messages for update to authenticated
using (sender_id = auth.uid() and public.is_direct_raven_participant(conversation_id))
with check (sender_id = auth.uid() and public.is_direct_raven_participant(conversation_id));

create policy direct_raven_reads_read_own
on public.direct_raven_reads for select to authenticated
using (user_id = auth.uid() and public.is_direct_raven_participant(conversation_id));

create policy direct_raven_reads_insert_own
on public.direct_raven_reads for insert to authenticated
with check (user_id = auth.uid() and public.is_direct_raven_participant(conversation_id));

create policy direct_raven_reads_update_own
on public.direct_raven_reads for update to authenticated
using (user_id = auth.uid() and public.is_direct_raven_participant(conversation_id))
with check (user_id = auth.uid() and public.is_direct_raven_participant(conversation_id));

create policy direct_raven_blocks_read_involved
on public.direct_raven_blocks for select to authenticated
using (blocker_id = auth.uid() or blocked_id = auth.uid());

create policy direct_raven_blocks_insert_own
on public.direct_raven_blocks for insert to authenticated
with check (blocker_id = auth.uid() and blocked_id <> auth.uid());

create policy direct_raven_blocks_delete_own
on public.direct_raven_blocks for delete to authenticated
using (blocker_id = auth.uid());

-- The only normal entry point for creating a conversation. The caller can name
-- the recipient, but cannot choose the sender UUID.
create or replace function public.start_direct_raven(target_username text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  target uuid;
  conversation_uuid uuid;
begin
  if me is null then raise exception 'authentication_required'; end if;

  select p.id into target
  from public.profiles p
  where lower(p.username) = lower(trim(target_username));

  if target is null then raise exception 'recipient_not_found'; end if;
  if target = me then raise exception 'cannot_message_self'; end if;

  if exists (
    select 1 from public.direct_raven_blocks b
    where (b.blocker_id = me and b.blocked_id = target)
       or (b.blocker_id = target and b.blocked_id = me)
  ) then
    raise exception 'direct_raven_blocked';
  end if;

  select c.id into conversation_uuid
  from public.direct_raven_conversations c
  where (c.user_a = me and c.user_b = target)
     or (c.user_a = target and c.user_b = me)
  limit 1;

  if conversation_uuid is not null then return conversation_uuid; end if;

  begin
    insert into public.direct_raven_conversations (user_a, user_b)
    values (me, target)
    returning id into conversation_uuid;
  exception when unique_violation then
    select c.id into conversation_uuid
    from public.direct_raven_conversations c
    where (c.user_a = me and c.user_b = target)
       or (c.user_a = target and c.user_b = me)
    limit 1;
  end;

  return conversation_uuid;
end;
$$;
revoke all on function public.start_direct_raven(text) from public;
grant execute on function public.start_direct_raven(text) to authenticated;

create or replace function public.direct_raven_unread_count()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::bigint
  from public.direct_raven_messages m
  join public.direct_raven_conversations c on c.id = m.conversation_id
  left join public.direct_raven_reads r
    on r.conversation_id = c.id and r.user_id = auth.uid()
  where auth.uid() in (c.user_a, c.user_b)
    and m.sender_id <> auth.uid()
    and m.deleted_at is null
    and m.created_at > coalesce(r.last_read_at, '-infinity'::timestamptz);
$$;
revoke all on function public.direct_raven_unread_count() from public;
grant execute on function public.direct_raven_unread_count() to authenticated;

create or replace function public.touch_direct_raven_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.direct_raven_conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;
create trigger direct_raven_message_touch_conversation
  after insert on public.direct_raven_messages
  for each row execute function public.touch_direct_raven_conversation();

create or replace function public.protect_direct_raven_message_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
    or new.conversation_id <> old.conversation_id
    or new.sender_id <> old.sender_id
    or new.created_at <> old.created_at then
    raise exception 'protected_message_fields';
  end if;
  if new.body is distinct from old.body and new.deleted_at is null then
    new.edited_at := now();
  end if;
  return new;
end;
$$;
create trigger protect_direct_raven_message_fields
  before update on public.direct_raven_messages
  for each row execute function public.protect_direct_raven_message_fields();

-- Realtime delivery for open conversations. RLS still controls what clients can read.
alter publication supabase_realtime add table public.direct_raven_messages;

notify pgrst, 'reload schema';
commit;
