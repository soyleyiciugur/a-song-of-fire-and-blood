begin;

alter table public.member_likes
  add column if not exists reaction text not null default '❤️';

alter table public.member_likes drop constraint if exists member_likes_reaction_length;
alter table public.member_likes add constraint member_likes_reaction_length check (char_length(reaction) between 1 and 32);

create or replace function public.set_message_reaction(target text, reaction text)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid := auth.uid();
  current_reaction text;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if reaction is null or char_length(reaction) < 1 or char_length(reaction) > 32 then raise exception 'invalid_reaction'; end if;
  if not public.can_read_like_target('message', target) then raise exception 'invalid_reaction_target'; end if;

  select l.reaction into current_reaction
  from public.member_likes l
  where l.user_id=uid and l.target_kind='message' and l.target_id=target;

  if current_reaction = reaction then
    delete from public.member_likes where user_id=uid and target_kind='message' and target_id=target;
    return null;
  end if;

  insert into public.member_likes(user_id,target_kind,target_id,reaction)
  values(uid,'message',target,reaction)
  on conflict(user_id,target_kind,target_id) do update set reaction=excluded.reaction, created_at=now();
  return reaction;
end;
$$;

revoke all on function public.set_message_reaction(text,text) from public;
grant execute on function public.set_message_reaction(text,text) to authenticated;

notify pgrst,'reload schema';
commit;
