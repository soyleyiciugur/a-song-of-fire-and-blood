begin;

alter table public.character_inner_court
  add column if not exists character_ids text[] not null default '{}',
  add column if not exists is_private boolean not null default false,
  add column if not exists hide_from_gm boolean not null default false,
  add column if not exists survey_key text;
alter table public.character_inner_court add constraint inner_court_hidden_requires_private check (not hide_from_gm or is_private);
alter table public.character_inner_court add constraint gm_counsel_is_private check (character_id <> 'hrrm' or is_private);
create unique index inner_court_survey_key on public.character_inner_court(character_id, survey_key) where survey_key is not null;

create or replace function public.is_inner_court_gm() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and lower(username) = 'hrrm');
$$;
revoke all on function public.is_inner_court_gm() from public;
grant execute on function public.is_inner_court_gm() to anon, authenticated;
grant execute on function public.can_edit_character_inner_court(text) to anon;

drop policy if exists "Inner Court is publicly readable" on public.character_inner_court;
create policy "Inner Court respects privacy" on public.character_inner_court for select using (
  not is_private or public.can_edit_character_inner_court(character_id)
  or (not hide_from_gm and public.is_inner_court_gm())
);

create table public.inner_court_surveys (
  character_id text primary key references public.character_player_assignments(character_id),
  owner_id uuid not null references public.profiles(id),
  survey_version text not null,
  answers jsonb not null default '{}',
  step integer not null default 0 check(step >= 0),
  revision integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.inner_court_surveys enable row level security;
create policy "Only assigned owner reads survey drafts" on public.inner_court_surveys for select to authenticated
  using (owner_id = auth.uid() and public.can_edit_character_inner_court(character_id));

-- A single transaction saves the draft and optionally seals the answered portion.
-- Survey drafts never grant GM access to another player's hidden answers.
create or replace function public.save_inner_court_survey(
  target_character text, version_key text, draft_answers jsonb, draft_step integer,
  expected_revision integer, seal boolean, complete boolean, sealed_entries jsonb
) returns public.inner_court_surveys
language plpgsql security definer set search_path = public as $$
declare saved public.inner_court_surveys; item jsonb;
begin
  if auth.uid() is null or not public.can_edit_character_inner_court(target_character) then
    raise exception 'Not permitted' using errcode = '42501';
  end if;
  if jsonb_typeof(draft_answers) <> 'object' or pg_column_size(draft_answers) > 150000 or draft_step < 0 then
    raise exception 'Invalid draft';
  end if;
  insert into public.inner_court_surveys(character_id, owner_id, survey_version)
    values(target_character, auth.uid(), version_key) on conflict do nothing;
  select * into saved from public.inner_court_surveys where character_id = target_character for update;
  if saved.owner_id <> auth.uid() or saved.revision <> expected_revision then
    raise exception 'Survey changed in another session. Reload before saving.' using errcode = '40001';
  end if;
  if seal then
    if jsonb_typeof(sealed_entries) <> 'array' or jsonb_array_length(sealed_entries) > 100 then raise exception 'Invalid entries'; end if;
    for item in select value from jsonb_array_elements(sealed_entries) loop
      if item->>'body' is null then
        delete from public.character_inner_court where character_id = target_character and survey_key = version_key || ':' || (item->>'key');
      else
        insert into public.character_inner_court(character_id, chapter_slug, kind, subject, body, created_by, character_ids, is_private, hide_from_gm, survey_key)
        values(target_character, item->>'chapter', item->>'kind', item->>'subject', item->>'body', auth.uid(),
          array(select jsonb_array_elements_text(item->'characters')), (item->>'private')::boolean,
          (item->>'hideFromGm')::boolean, version_key || ':' || (item->>'key'))
        on conflict (character_id, survey_key) where survey_key is not null do update set
          chapter_slug = excluded.chapter_slug, kind = excluded.kind, subject = excluded.subject,
          body = excluded.body, character_ids = excluded.character_ids, is_private = excluded.is_private,
          hide_from_gm = excluded.hide_from_gm, updated_at = now();
      end if;
    end loop;
  end if;
  update public.inner_court_surveys set answers = draft_answers, step = draft_step, revision = revision + 1,
    completed_at = case when complete then coalesce(completed_at, now()) else completed_at end, updated_at = now()
    where character_id = target_character returning * into saved;
  return saved;
end;
$$;
revoke all on function public.save_inner_court_survey(text,text,jsonb,integer,integer,boolean,boolean,jsonb) from public;
grant execute on function public.save_inner_court_survey(text,text,jsonb,integer,integer,boolean,boolean,jsonb) to authenticated;

commit;
