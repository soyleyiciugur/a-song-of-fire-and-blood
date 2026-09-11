begin;
alter table public.profiles add column if not exists profile_theme text not null default 'default' check(profile_theme in ('default','dragonfire','winterfell','oldtown','royal','night'));
notify pgrst,'reload schema';
commit;
