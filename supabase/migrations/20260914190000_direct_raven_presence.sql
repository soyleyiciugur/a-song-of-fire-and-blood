-- Cross-device Direct Raven presence. A recipient with this conversation visibly open
-- should not receive Rookery/push noise for messages they are already reading.
create table if not exists public.direct_raven_presence (
  conversation_id uuid not null references public.direct_raven_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  active_until timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.direct_raven_presence enable row level security;

drop policy if exists direct_raven_presence_select_own on public.direct_raven_presence;
create policy direct_raven_presence_select_own on public.direct_raven_presence
  for select using (auth.uid() = user_id);

drop policy if exists direct_raven_presence_insert_own on public.direct_raven_presence;
create policy direct_raven_presence_insert_own on public.direct_raven_presence
  for insert with check (auth.uid() = user_id and public.is_direct_raven_participant(conversation_id));

drop policy if exists direct_raven_presence_update_own on public.direct_raven_presence;
create policy direct_raven_presence_update_own on public.direct_raven_presence
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id and public.is_direct_raven_participant(conversation_id));

drop policy if exists direct_raven_presence_delete_own on public.direct_raven_presence;
create policy direct_raven_presence_delete_own on public.direct_raven_presence
  for delete using (auth.uid() = user_id);

create index if not exists direct_raven_presence_active_idx
  on public.direct_raven_presence (conversation_id, user_id, active_until);


-- Global page presence: when the Direct Raven workspace is visibly open on any device,
-- message notifications are suppressed account-wide.
create table if not exists public.direct_raven_page_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_until timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.direct_raven_page_presence enable row level security;

drop policy if exists direct_raven_page_presence_select_own on public.direct_raven_page_presence;
create policy direct_raven_page_presence_select_own on public.direct_raven_page_presence
  for select using (auth.uid() = user_id);

drop policy if exists direct_raven_page_presence_insert_own on public.direct_raven_page_presence;
create policy direct_raven_page_presence_insert_own on public.direct_raven_page_presence
  for insert with check (auth.uid() = user_id);

drop policy if exists direct_raven_page_presence_update_own on public.direct_raven_page_presence;
create policy direct_raven_page_presence_update_own on public.direct_raven_page_presence
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists direct_raven_page_presence_delete_own on public.direct_raven_page_presence;
create policy direct_raven_page_presence_delete_own on public.direct_raven_page_presence
  for delete using (auth.uid() = user_id);

create index if not exists direct_raven_page_presence_active_idx
  on public.direct_raven_page_presence (active_until);
