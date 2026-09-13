begin;
alter table public.profiles drop constraint if exists profiles_profile_theme_check;
alter table public.profiles add constraint profiles_profile_theme_check check(profile_theme in ('default','targaryen','stark','arryn','tully','greyjoy','lannister','baratheon','tyrell','martell','dragonfire','winterfell','oldtown','royal','night','custom'));
notify pgrst,'reload schema';
commit;
