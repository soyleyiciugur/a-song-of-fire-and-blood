begin;

alter table public.profiles
  add column if not exists played_character_id text
  check (
    played_character_id is null
    or played_character_id ~ '^[a-z0-9][a-z0-9-]{1,79}$'
  );

comment on column public.profiles.played_character_id is
  'Canonical repository character id represented by this member at the table.';

-- Existing identities that are established in the public community record.
update public.profiles
set played_character_id = 'jacaelon-targaryen'
where username = 'luck' and played_character_id is null;

update public.profiles
set played_character_id = 'hrrm'
where username = 'hrrm' and played_character_id is null;

commit;
