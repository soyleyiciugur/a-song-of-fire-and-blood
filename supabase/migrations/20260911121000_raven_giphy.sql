begin;
alter table public.direct_raven_messages add column gif jsonb;
alter table public.direct_raven_messages drop constraint direct_raven_message_length;
alter table public.direct_raven_messages add constraint direct_raven_message_length check(char_length(body)<=4000 and (char_length(trim(body))>0 or attachment_path is not null or gif is not null));
create function public.validate_raven_gif() returns trigger language plpgsql set search_path='' as $$
begin
 if new.gif is not null and (jsonb_typeof(new.gif)<>'object' or not(new.gif ?& array['id','url','title']) or jsonb_typeof(new.gif->'id')<>'string' or jsonb_typeof(new.gif->'url')<>'string' or jsonb_typeof(new.gif->'title')<>'string' or char_length(new.gif->>'title')>500 or coalesce(new.gif->>'id','')!~'^[a-zA-Z0-9]{1,100}$' or coalesce(new.gif->>'url','')!~'^https://media[0-9]*\.giphy\.com/media/[a-zA-Z0-9/_.~-]+\.gif([?][^[:space:]]*)?$' or octet_length(new.gif::text)>4000) then raise exception 'invalid_gif'; end if;
 if TG_OP='UPDATE' and new.gif is distinct from old.gif then raise exception 'protected_gif'; end if;
 return new;
end $$;
create trigger validate_raven_gif before insert or update on public.direct_raven_messages for each row execute function public.validate_raven_gif();
notify pgrst,'reload schema';
commit;
