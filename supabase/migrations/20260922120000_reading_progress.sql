create table if not exists public.reading_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chapter_slug text not null,
  page_index integer not null default 0 check (page_index >= 0),
  updated_at timestamptz not null default now()
);

alter table public.reading_progress enable row level security;

drop policy if exists "Members read own reading progress" on public.reading_progress;
create policy "Members read own reading progress" on public.reading_progress
  for select using (auth.uid() = user_id);

drop policy if exists "Members insert own reading progress" on public.reading_progress;
create policy "Members insert own reading progress" on public.reading_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "Members update own reading progress" on public.reading_progress;
create policy "Members update own reading progress" on public.reading_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_reading_progress_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reading_progress_touch_updated_at on public.reading_progress;
create trigger reading_progress_touch_updated_at
before update on public.reading_progress
for each row execute function public.touch_reading_progress_updated_at();
