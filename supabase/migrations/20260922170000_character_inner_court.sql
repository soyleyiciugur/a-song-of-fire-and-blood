begin;

create table if not exists public.character_inner_court (
  id uuid primary key default gen_random_uuid(),
  character_id text not null check (character_id ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  chapter_slug text not null check (chapter_slug ~ '^[a-z0-9][a-z0-9-]{1,99}$'),
  kind text not null check (kind in ('thought','suspicion','preference','belief','theory','question')),
  subject text,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  status text not null default 'active' check (status in ('active','changed','resolved')),
  supersedes uuid references public.character_inner_court(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists character_inner_court_character_chapter_idx
  on public.character_inner_court(character_id, chapter_slug, created_at);

alter table public.character_inner_court enable row level security;

create or replace function public.can_edit_character_inner_court(target_character_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and played_character_id = target_character_id
  );
$$;

revoke all on function public.can_edit_character_inner_court(text) from public;
grant execute on function public.can_edit_character_inner_court(text) to authenticated;

drop policy if exists "Inner Court is publicly readable" on public.character_inner_court;
create policy "Inner Court is publicly readable"
  on public.character_inner_court for select using (true);

drop policy if exists "Players create own character thoughts" on public.character_inner_court;
create policy "Players create own character thoughts"
  on public.character_inner_court for insert to authenticated
  with check (public.can_edit_character_inner_court(character_id) and created_by = auth.uid());

drop policy if exists "Players update own character thoughts" on public.character_inner_court;
create policy "Players update own character thoughts"
  on public.character_inner_court for update to authenticated
  using (public.can_edit_character_inner_court(character_id))
  with check (public.can_edit_character_inner_court(character_id));

drop policy if exists "Players delete own character thoughts" on public.character_inner_court;
create policy "Players delete own character thoughts"
  on public.character_inner_court for delete to authenticated
  using (public.can_edit_character_inner_court(character_id));

update public.profiles set played_character_id = 'jacaelon-targaryen' where username = 'luck';
update public.profiles set played_character_id = 'visenor-targaryen' where username = 'ubeka';
update public.profiles set played_character_id = 'hrrm' where username = 'hrrm';

insert into public.character_inner_court (id, character_id, chapter_slug, kind, subject, body, status, created_by)
values
  ('10000000-0000-4000-8000-000000000001','jacaelon-targaryen','the-price-of-trust','suspicion','The Hand','The bank records do not match Derrin Hightower''s hand. Suspicion is not proof, and someone may be arranging the evidence to point toward him.','active',null),
  ('10000000-0000-4000-8000-000000000002','jacaelon-targaryen','judgment-by-blood','belief','The Crown','Every crisis has made caution look less like fear and more like foresight. The realm will need a hand willing to see danger before the rest of the court names it.','active',null),
  ('10000000-0000-4000-8000-000000000003','visenor-targaryen','the-poison-beneath-the-crown','question','His siblings','If poison can reach the king''s own table, which bonds within the royal family can still be trusted without reservation?','active',null),
  ('10000000-0000-4000-8000-000000000004','visenor-targaryen','judgment-by-blood','suspicion','Starfall','The report of burned men and a loose dragon points toward Boneskin. If the dragon has left the mountains, Rhaella may be caught in whatever happened there.','active',null),
  ('10000000-0000-4000-8000-000000000005','gaelor-targaryen','the-poison-beneath-the-crown','question','The assassin','The dying man''s accusation named the Hand, but killing him ended any chance to learn whether it was truth, a lie, or bait.','active',null),
  ('10000000-0000-4000-8000-000000000006','gaelor-targaryen','judgment-by-blood','theory','The Stepstones','A victory in the Stepstones, won with Braavosi support, could restore the authority and honour expected of an heir more decisively than another season at court.','active',null)
on conflict (id) do nothing;

commit;
