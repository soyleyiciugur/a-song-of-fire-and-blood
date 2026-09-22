create type public.story_thread_status as enum ('Open', 'Dormant', 'Resolved');

create table public.story_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  status public.story_thread_status not null default 'Open',
  character_ids text[] not null default '{}',
  chapter_refs text[] not null default '{}',
  date_opened date not null default current_date,
  latest_development text not null default '' check (char_length(latest_development) <= 1000),
  private_gm_context text check (private_gm_context is null or char_length(private_gm_context) <= 2000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.story_threads enable row level security;
revoke all on public.story_threads from anon, authenticated;
grant select, insert, update, delete on public.story_threads to authenticated;

create policy story_threads_admin_select on public.story_threads for select to authenticated
using (exists(select 1 from public.profiles where id=auth.uid() and (role='admin' or lower(username)='luck')));
create policy story_threads_admin_insert on public.story_threads for insert to authenticated
with check (exists(select 1 from public.profiles where id=auth.uid() and (role='admin' or lower(username)='luck')) and created_by=auth.uid());
create policy story_threads_admin_update on public.story_threads for update to authenticated
using (exists(select 1 from public.profiles where id=auth.uid() and (role='admin' or lower(username)='luck')))
with check (exists(select 1 from public.profiles where id=auth.uid() and (role='admin' or lower(username)='luck')));
create policy story_threads_admin_delete on public.story_threads for delete to authenticated
using (exists(select 1 from public.profiles where id=auth.uid() and (role='admin' or lower(username)='luck')));

create view public.story_threads_public with (security_invoker=false, security_barrier=true) as
select id,title,description,status,character_ids,chapter_refs,date_opened,latest_development,created_at,updated_at
from public.story_threads;
revoke all on public.story_threads_public from public;
grant select on public.story_threads_public to anon, authenticated;

create or replace function public.set_story_thread_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end; $$;
create trigger story_threads_updated_at before update on public.story_threads for each row execute function public.set_story_thread_updated_at();
