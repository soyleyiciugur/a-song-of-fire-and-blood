begin;

alter table public.site_notifications drop constraint if exists site_notifications_kind_check;
alter table public.site_notifications add constraint site_notifications_kind_check check (kind in (
  'tavern_answer','tavern_favor','ravens_eye_answer','ravens_eye_like',
  'direct_raven','guild_parley','ravens_eye_image','gutter_meme','gutter_reel',
  'new_chapter','realm_notice','guestbook_entry','guestbook_reply',
  'new_tavern_thread','tavern_participant_activity','ravens_eye_root_comment'
));
alter table public.site_notifications drop constraint if exists site_notifications_source_check;
alter table public.site_notifications add constraint site_notifications_source_check check (source in (
  'tavern','ravens-eye','direct-raven','guild-parley','chronicle','guestbook','realm'
));

alter table public.notification_preferences alter column preferences set default '{
  "tavern_answers": true,
  "tavern_favor": true,
  "ravens_eye_answers": true,
  "ravens_eye_likes": true,
  "direct_ravens": true,
  "guild_parley": true,
  "ravens_eye_images": true,
  "gutter_memes": true,
  "gutter_reels": true,
  "new_chapters": true,
  "guestbook_entries": true,
  "guestbook_replies": true,
  "new_tavern_threads": false,
  "tavern_participant_activity": false,
  "ravens_eye_root_comments": false,
  "realm_notices": true
}'::jsonb;

create table if not exists public.direct_raven_system_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_raven_conversations(id) on delete cascade,
  event_type text not null check (event_type in ('member_added','member_removed','details_changed')),
  actor_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists direct_raven_system_events_conversation_idx on public.direct_raven_system_events(conversation_id,created_at,id);
alter table public.direct_raven_system_events enable row level security;
drop policy if exists direct_raven_system_events_read on public.direct_raven_system_events;
create policy direct_raven_system_events_read on public.direct_raven_system_events for select to authenticated
using (public.is_direct_raven_participant(conversation_id));

create or replace function public.record_guild_member_event()
returns trigger language plpgsql security definer set search_path='' as $$
declare guild boolean; actor_name text; target_name text;
begin
  select exists(select 1 from public.direct_raven_conversations c where c.id=coalesce(new.conversation_id,old.conversation_id) and c.kind='guild') into guild;
  if not guild then return coalesce(new,old); end if;
  select display_name into actor_name from public.profiles where id=auth.uid();
  select display_name into target_name from public.profiles where id=coalesce(new.user_id,old.user_id);
  insert into public.direct_raven_system_events(conversation_id,event_type,actor_id,target_user_id,detail)
  values(coalesce(new.conversation_id,old.conversation_id),case when tg_op='INSERT' then 'member_added' else 'member_removed' end,auth.uid(),coalesce(new.user_id,old.user_id),jsonb_build_object('actorName',actor_name,'targetName',target_name));
  return coalesce(new,old);
end;
$$;
drop trigger if exists record_guild_member_event on public.direct_raven_members;
create trigger record_guild_member_event after insert or delete on public.direct_raven_members for each row execute function public.record_guild_member_event();

create or replace function public.record_guild_details_event()
returns trigger language plpgsql security definer set search_path='' as $$
declare actor_name text;
begin
  if new.kind<>'guild' then return new; end if;
  if new.title is not distinct from old.title and new.description is not distinct from old.description then return new; end if;
  select display_name into actor_name from public.profiles where id=auth.uid();
  insert into public.direct_raven_system_events(conversation_id,event_type,actor_id,detail)
  values(new.id,'details_changed',auth.uid(),jsonb_build_object('actorName',actor_name,'oldTitle',old.title,'newTitle',new.title,'descriptionChanged',new.description is distinct from old.description));
  return new;
end;
$$;
drop trigger if exists record_guild_details_event on public.direct_raven_conversations;
create trigger record_guild_details_event after update of title,description on public.direct_raven_conversations for each row execute function public.record_guild_details_event();

notify pgrst,'reload schema';
commit;
