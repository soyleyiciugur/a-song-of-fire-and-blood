create or replace function public.replace_private_ledger_entries(replacement jsonb)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  owner_id uuid := auth.uid();
  imported_count integer;
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(replacement) <> 'array' then raise exception 'Replacement must be an array'; end if;
  if jsonb_array_length(replacement) > 250 then raise exception 'At most 250 entries may be imported'; end if;

  delete from public.private_ledger_entries where user_id = owner_id;

  insert into public.private_ledger_entries (
    user_id, heading, matter, checklist, pinned, status, archived,
    character_ids, chapter_slug, created_at, updated_at
  )
  select
    owner_id,
    item->>'heading',
    coalesce(item->>'matter', ''),
    coalesce(item->'checklist', '[]'::jsonb),
    coalesce((item->>'pinned')::boolean, false),
    coalesce(item->>'status', 'open'),
    coalesce((item->>'archived')::boolean, false),
    array(select jsonb_array_elements_text(coalesce(item->'character_ids', '[]'::jsonb))),
    nullif(item->>'chapter_slug', ''),
    coalesce((item->>'created_at')::timestamptz, now()),
    coalesce((item->>'updated_at')::timestamptz, now())
  from jsonb_array_elements(replacement) as item;

  get diagnostics imported_count = row_count;
  return imported_count;
end;
$$;

revoke all on function public.replace_private_ledger_entries(jsonb) from public, anon;
grant execute on function public.replace_private_ledger_entries(jsonb) to authenticated;
