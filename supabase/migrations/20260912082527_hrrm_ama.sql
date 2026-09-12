-- Explicitly requested AMA opening, attributed to the existing real member.
begin;
do $$ begin
  if not exists (select 1 from public.profiles where id='ebe7fa8b-b6cd-41b1-8508-48dfb6296771' and username='hrrm') then raise exception 'HRRM profile mismatch'; end if;
end $$;
insert into public.forum_threads (id,title,body,category,spoiler_through,author_type,user_author_id,created_at)
values ('c774865d-28f3-4cd5-abc0-657227dc44c6','HRRM AMA','Hi, I''m HRRM, ask me anything!','Community','the-children-pay','user','ebe7fa8b-b6cd-41b1-8508-48dfb6296771','2026-09-12T08:25:26.949Z')
on conflict (id) do nothing;
commit;
