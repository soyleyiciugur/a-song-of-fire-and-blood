begin;
update public.profiles set profile_theme='dragonfire' where profile_theme='targaryen';
update public.profiles set profile_theme='winterfell' where profile_theme='stark';
alter table public.profile_guestbook add column if not exists parent_id uuid references public.profile_guestbook(id) on delete cascade;
create index if not exists guestbook_parent on public.profile_guestbook(parent_id,created_at);
create or replace function public.validate_guestbook_parent()
returns trigger language plpgsql security invoker set search_path='' as $$
declare parent_profile uuid;
begin
  if new.parent_id is null then return new; end if;
  select profile_id into parent_profile from public.profile_guestbook where id=new.parent_id;
  if parent_profile is null or parent_profile<>new.profile_id then raise exception 'Guestbook reply must share its parent profile'; end if;
  return new;
end;
$$;
drop trigger if exists validate_guestbook_parent on public.profile_guestbook;
create trigger validate_guestbook_parent before insert or update of parent_id,profile_id on public.profile_guestbook for each row execute function public.validate_guestbook_parent();
notify pgrst,'reload schema';
commit;
