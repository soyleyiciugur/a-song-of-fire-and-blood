begin;

-- Repairs auth users created before the profile trigger existed. Identity and role
-- are derived in the database; callers cannot select another user or role.
create or replace function public.ensure_own_profile()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  auth_user auth.users;
  candidate text;
  result public.profiles;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into auth_user from auth.users where id = auth.uid();
  select * into result from public.profiles where id = auth.uid();
  if found then return result; end if;

  candidate := lower(coalesce(nullif(trim(auth_user.raw_user_meta_data ->> 'username'), ''), split_part(auth_user.email, '@', 1), 'member'));
  candidate := regexp_replace(candidate, '[^a-z0-9_-]', '', 'g');
  candidate := regexp_replace(candidate, '^[^a-z0-9]+', '');
  if char_length(candidate) < 3 then candidate := 'member_' || left(replace(auth.uid()::text, '-', ''), 8); end if;
  candidate := left(candidate, 30);
  if exists (select 1 from public.profiles where lower(username) = candidate) then
    candidate := left(candidate, 23) || '_' || left(replace(auth.uid()::text, '-', ''), 6);
  end if;

  insert into public.profiles (id, username, display_name)
  values (auth.uid(), candidate, left(coalesce(nullif(trim(auth_user.raw_user_meta_data ->> 'display_name'), ''), candidate), 60))
  returning * into result;
  return result;
end;
$$;

revoke all on function public.ensure_own_profile() from public;
grant execute on function public.ensure_own_profile() to authenticated;

notify pgrst, 'reload schema';

commit;
